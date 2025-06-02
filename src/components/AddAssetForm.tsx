import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Controller } from "react-hook-form";
import { useAddAssetForm } from "../hooks/useAddAssetForm";
import { AssetType, AddAssetFormData } from "../types";
import {
  getAssetSuggestions,
  detectAssetType,
  getAssetName,
} from "../utils/assetUtils";
import { styled } from "nativewind";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { fetchAssetPrice, fetchExchangeRate } from "../services/api";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const ASSET_TYPES: AssetType[] = ["stock", "etf", "crypto", "cash"];
const DEBOUNCE_DELAY = 1000;

// Fix the autoCapitalize type
const getAutoCapitalize = (
  assetType: AssetType
): "characters" | "none" | "sentences" | "words" => {
  return assetType === "cash" ? "characters" : "none";
};

// Add formatting function
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const AddAssetForm: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const {
    control,
    handleSubmit,
    onSubmit,
    errors,
    setValue,
    watch,
    isSubmitting,
    reset,
  } = useAddAssetForm();
  const [suggestions, setSuggestions] = useState<
    Array<{ symbol: string; name: string; type: AssetType }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputPosition, setInputPosition] = useState({ x: 0, y: 0, width: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout | number | undefined>();
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Watch asset type to conditionally show currency input
  const assetType = watch("type");

  // Watch form values
  const symbol = watch("symbol");
  const quantity = watch("quantity");

  // Calculate total value
  const totalValue =
    currentPrice && quantity ? currentPrice * parseFloat(quantity) : 0;

  console.log("AddAssetForm: Check market value display conditions:", {
    assetType,
    quantity,
    symbol,
    isLoadingPrice,
    currentPrice,
    isStockEtfCrypto:
      assetType === "stock" || assetType === "etf" || assetType === "crypto",
    isQuantityValid: parseFloat(quantity) > 0,
    isSymbolValid: symbol.trim() !== "",
    isPriceAvailable: !isLoadingPrice && currentPrice !== null,
  });

  const handleSymbolChange = useCallback(
    (text: string, onChange: (value: string) => void) => {
      onChange(text);

      // Clear any existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(
        async () => {
          try {
            const upperText = text.toUpperCase();
            const newSuggestions = getAssetSuggestions(text);
            setSuggestions(newSuggestions);
            setShowSuggestions(newSuggestions.length > 0);

            let detectedType = assetType;

            // If there's an exact match, auto-detect the type
            const exactMatch = newSuggestions.find(
              (s) => s.symbol === upperText
            );
            if (exactMatch) {
              detectedType = exactMatch.type;
              setValue("type", detectedType);
              // For cash assets, use the symbol as the currency
              if (detectedType === "cash") {
                setValue("currency", exactMatch.symbol);
              }
              setPriceError(null); // Clear any previous error
            } else {
              // If no exact match and we have a non-empty input, show error
              if (text.trim()) {
                if (detectedType !== "cash") {
                  setPriceError(
                    `Symbol "${upperText}" not recognized. Please select from suggestions or enter a valid symbol.`
                  );
                }
              } else {
                setPriceError(null);
              }
              // Otherwise, try to detect type from the input if no exact match
              detectedType = detectAssetType(text);
              setValue("type", detectedType);
              // For cash assets, use the symbol as the currency
              if (detectedType === "cash") {
                setValue("currency", text.toUpperCase());
              }
            }

            // --- Start Price Fetch Logic (Moved from useEffect) ---
            console.log(
              "AddAssetForm: Debounce finished, attempting to fetch price",
              { symbol: upperText, assetType: detectedType }
            );
            if (
              upperText &&
              (detectedType === "stock" ||
                detectedType === "etf" ||
                detectedType === "crypto" ||
                detectedType === "cash")
            ) {
              setIsLoadingPrice(true);
              setPriceError(null);
              setCurrentPrice(null); // Clear previous price while fetching
              try {
                let priceData;
                if (detectedType === "cash") {
                  // Assuming fetchExchangeRate takes the currency symbol and returns rate vs USD
                  priceData = await fetchExchangeRate(upperText);
                } else {
                  priceData = await fetchAssetPrice(upperText, detectedType);
                }
                console.log(
                  "AddAssetForm: Price fetch result (debounce):",
                  priceData
                );
                if (
                  priceData &&
                  priceData.price !== undefined &&
                  priceData.price !== null
                ) {
                  setCurrentPrice(priceData.price);
                  setPriceError(null);
                  console.log(
                    "AddAssetForm: Successfully set current price (debounce):",
                    priceData.price
                  );
                } else {
                  // Only set price error if there's no valid price data
                  setPriceError("Could not fetch price for symbol.");
                  setCurrentPrice(null);
                  console.log(
                    "AddAssetForm: Price data is invalid or null (debounce).",
                    priceData
                  );
                }
              } catch (error) {
                console.error(
                  "AddAssetForm: Error fetching price (debounce):",
                  error
                );
                setPriceError(
                  error instanceof Error
                    ? error.message
                    : "Failed to fetch price"
                );
                setCurrentPrice(null);
              } finally {
                setIsLoadingPrice(false);
                console.log(
                  "AddAssetForm: Price fetch finally block executed (debounce)"
                );
              }
            } else {
              // Clear price info if symbol is empty or type is not price-fetchable
              setCurrentPrice(null);
              setPriceError(null);
              setIsLoadingPrice(false);
              console.log(
                "AddAssetForm: Symbol is empty or asset type not price-fetchable."
              );
            }
            // --- End Price Fetch Logic ---
          } catch (error) {
            console.error("Error in handleSymbolChange debounce:", error);
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to process symbol. Please try again.",
            });
            setIsLoadingPrice(false); // Ensure loading is off on error
          } finally {
            // Clear debounce timer after execution
            debounceTimer.current = undefined; // Explicitly set to undefined
          }
        },
        DEBOUNCE_DELAY,
        assetType
      );
    },
    [setValue, assetType]
  );

  const handleSuggestionSelect = useCallback(
    async (suggestion: { symbol: string; name: string; type: AssetType }) => {
      try {
        setIsSelecting(true);
        setShowSuggestions(false);
        setValue("symbol", suggestion.symbol);
        setValue("type", suggestion.type);
        // For cash assets, use the symbol as the currency
        if (suggestion.type === "cash") {
          setValue("currency", suggestion.symbol);
        }

        // --- Start Price Fetch Logic for Suggestion Select ---
        console.log(
          "AddAssetForm: Suggestion selected, attempting to fetch price",
          { symbol: suggestion.symbol, assetType: suggestion.type }
        );
        if (
          suggestion.symbol &&
          (suggestion.type === "stock" ||
            suggestion.type === "etf" ||
            suggestion.type === "crypto" ||
            suggestion.type === "cash")
        ) {
          setIsLoadingPrice(true);
          setPriceError(null);
          setCurrentPrice(null); // Clear previous price while fetching
          try {
            let priceData;
            if (suggestion.type === "cash") {
              priceData = await fetchExchangeRate(suggestion.symbol);
            } else {
              priceData = await fetchAssetPrice(
                suggestion.symbol,
                suggestion.type
              );
            }
            console.log(
              "AddAssetForm: Price fetch result (suggestion):",
              priceData
            );
            if (
              priceData &&
              priceData.price !== undefined &&
              priceData.price !== null
            ) {
              setCurrentPrice(priceData.price);
              setPriceError(null);
              console.log(
                "AddAssetForm: Successfully set current price (suggestion):",
                priceData.price
              );
            } else {
              setPriceError("Could not fetch price for symbol.");
              setCurrentPrice(null);
              console.log(
                "AddAssetForm: Price data is invalid or null (suggestion).",
                priceData
              );
            }
          } catch (error) {
            console.error(
              "AddAssetForm: Error fetching price (suggestion):",
              error
            );
            setPriceError(
              error instanceof Error ? error.message : "Failed to fetch price"
            );
            setCurrentPrice(null);
          } finally {
            setIsLoadingPrice(false);
            console.log(
              "AddAssetForm: Price fetch finally block executed (suggestion)"
            );
          }
        } else {
          // Clear price info if symbol is empty or type is not price-fetchable
          setCurrentPrice(null);
          setPriceError(null);
          setIsLoadingPrice(false);
          console.log(
            "AddAssetForm: Symbol is empty or asset type not price-fetchable (suggestion)."
          );
        }
        // --- End Price Fetch Logic for Suggestion Select ---

        Keyboard.dismiss();
        // Reset the selecting flag after a short delay
        setTimeout(() => setIsSelecting(false), 100);
      } catch (error) {
        console.error("Error in handleSuggestionSelect:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to select suggestion. Please try again.",
        });
      }
    },
    [setValue, assetType]
  );

  const measureInput = () => {
    if (inputRef.current) {
      inputRef.current.measure((x, y, width, height, pageX, pageY) => {
        setInputPosition({
          x: pageX,
          y: pageY + height,
          width: width,
        });
      });
    }
  };

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Add effect to focus input when suggestions are shown
  React.useEffect(() => {
    if (showSuggestions && suggestions.length > 0 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSuggestions, suggestions.length]);

  const handleFormSubmit = async (data: any) => {
    if (priceError) {
      Toast.show({
        type: "error",
        text1: "Invalid Symbol",
        text2: priceError,
      });
      return;
    }

    try {
      await onSubmit(data);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Asset added successfully",
      });
      setIsModalVisible(false);
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error instanceof Error ? error.message : "Failed to add asset",
      });
    }
  };

  const handleOpenModal = () => {
    reset();
    setIsModalVisible(true);
  };

  return (
    <>
      <StyledTouchableOpacity
        onPress={handleOpenModal}
        className="bg-primary p-4 rounded-lg shadow-sm mb-4 flex-row items-center justify-center"
      >
        <Ionicons name="add-circle" size={24} color="white" />
        <StyledText className="text-white text-lg font-semibold ml-2">
          Add New Asset
        </StyledText>
      </StyledTouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <StyledView className="flex-1 bg-black/50 justify-center items-center p-4">
          <StyledView className="bg-white dark:bg-gray-900 w-full max-w-md rounded-lg p-4">
            <StyledView className="flex-row justify-between items-center mb-4">
              <StyledText className="text-xl font-semibold text-dark dark:text-white">
                Add New Asset
              </StyledText>
              <StyledTouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </StyledTouchableOpacity>
            </StyledView>

            <Controller
              control={control}
              name="symbol"
              rules={{ required: "Symbol is required" }}
              render={({ field: { onChange, value } }) => (
                <StyledView className="mb-4">
                  <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                    Symbol
                  </StyledText>
                  <StyledView className="relative">
                    <StyledTextInput
                      ref={inputRef}
                      className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-dark dark:text-white pr-10"
                      placeholder={
                        assetType === "cash"
                          ? "e.g., USD, EUR"
                          : "e.g., AAPL, BTC"
                      }
                      placeholderTextColor="#9CA3AF"
                      onChangeText={(text) =>
                        handleSymbolChange(text, onChange)
                      }
                      value={value}
                      autoCapitalize={getAutoCapitalize(assetType)}
                      onFocus={() => {
                        if (!isSelecting) {
                          measureInput();
                          if (value) {
                            const newSuggestions = getAssetSuggestions(value);
                            setSuggestions(newSuggestions);
                            setShowSuggestions(newSuggestions.length > 0);
                          }
                        }
                      }}
                      onLayout={measureInput}
                      blurOnSubmit={false}
                    />
                    {value ? (
                      <StyledTouchableOpacity
                        className="absolute right-3 h-full justify-center"
                        onPress={() => {
                          onChange("");
                          setSuggestions([]);
                          setShowSuggestions(false);
                          setValue("type", "stock");
                          if (inputRef.current) {
                            inputRef.current.focus();
                          }
                        }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#9CA3AF"
                        />
                      </StyledTouchableOpacity>
                    ) : null}
                    <Modal
                      visible={showSuggestions && suggestions.length > 0}
                      transparent
                      animationType="none"
                      onRequestClose={() => setShowSuggestions(false)}
                    >
                      <StyledTouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={() => setShowSuggestions(false)}
                      >
                        <StyledView
                          className="absolute bg-transparent"
                          style={{
                            top: inputPosition.y,
                            left: inputPosition.x,
                            width: inputPosition.width,
                            maxHeight: 200,
                          }}
                          pointerEvents="box-none"
                        >
                          <StyledView
                            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                            pointerEvents="auto"
                          >
                            <StyledScrollView
                              className="rounded-lg"
                              keyboardShouldPersistTaps="handled"
                              nestedScrollEnabled
                            >
                              {suggestions.map((suggestion) => (
                                <StyledTouchableOpacity
                                  key={suggestion.symbol}
                                  className="p-3 border-b border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-800"
                                  onPress={() =>
                                    handleSuggestionSelect(suggestion)
                                  }
                                >
                                  <StyledText className="text-dark dark:text-white font-semibold">
                                    {suggestion.symbol}
                                  </StyledText>
                                  <StyledText className="text-gray-600 dark:text-gray-300 text-sm">
                                    {suggestion.name} (
                                    {suggestion.type.toUpperCase()})
                                  </StyledText>
                                </StyledTouchableOpacity>
                              ))}
                            </StyledScrollView>
                          </StyledView>
                        </StyledView>
                      </StyledTouchableOpacity>
                    </Modal>
                  </StyledView>
                  {errors.symbol && (
                    <StyledText className="text-danger text-sm mt-1">
                      {errors.symbol.message}
                    </StyledText>
                  )}
                </StyledView>
              )}
            />

            <Controller
              control={control}
              name="quantity"
              rules={{
                required: "Quantity is required",
                pattern: {
                  value: /^\d*\.?\d+$/,
                  message: "Please enter a valid number",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <StyledView className="mb-4">
                  <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                    Quantity
                  </StyledText>
                  <StyledTextInput
                    className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-dark dark:text-white"
                    placeholder="e.g., 10"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={onChange}
                    value={value}
                    keyboardType="decimal-pad"
                  />
                  {errors.quantity && (
                    <StyledText className="text-danger text-sm mt-1">
                      {errors.quantity.message}
                    </StyledText>
                  )}
                </StyledView>
              )}
            />

            {/* Current Market Price and Total Value Display */}
            {(assetType === "stock" ||
              assetType === "etf" ||
              assetType === "crypto" ||
              assetType === "cash") &&
              parseFloat(quantity) > 0 &&
              symbol.trim() !== "" &&
              !isLoadingPrice &&
              currentPrice !== null && (
                <StyledView className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {isLoadingPrice ? (
                    <StyledView className="flex-row items-center justify-center">
                      <ActivityIndicator size="small" color="#6B7280" />
                      <StyledText className="text-gray-600 dark:text-gray-300 ml-2">
                        Fetching price...
                      </StyledText>
                    </StyledView>
                  ) : priceError ? (
                    <StyledText className="text-danger text-sm">
                      {priceError}
                    </StyledText>
                  ) : currentPrice !== null ? (
                    <>
                      <StyledView className="flex-row justify-between mb-1">
                        <StyledText className="text-gray-600 dark:text-gray-300">
                          Current Market Price:
                        </StyledText>
                        <StyledText className="text-dark dark:text-white font-semibold">
                          {formatCurrency(currentPrice)}
                        </StyledText>
                      </StyledView>
                      <StyledView className="flex-row justify-between">
                        <StyledText className="text-gray-600 dark:text-gray-300">
                          Total Value:
                        </StyledText>
                        <StyledText className="text-primary font-semibold">
                          {formatCurrency(totalValue)}
                        </StyledText>
                      </StyledView>
                    </>
                  ) : null}
                  {/* Should not reach here if currentPrice is null and no error */}
                </StyledView>
              )}

            <Controller
              control={control}
              name="buyPrice"
              rules={{
                required: "Buy price is required",
                pattern: {
                  value: /^\d*\.?\d+$/,
                  message: "Please enter a valid number",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <StyledView className="mb-4">
                  <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                    Buy Price
                  </StyledText>
                  <StyledTextInput
                    className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-dark dark:text-white"
                    placeholder="e.g., 150.25"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={onChange}
                    value={value}
                    keyboardType="decimal-pad"
                  />
                  {errors.buyPrice && (
                    <StyledText className="text-danger text-sm mt-1">
                      {errors.buyPrice.message}
                    </StyledText>
                  )}
                </StyledView>
              )}
            />

            <Controller
              control={control}
              name="type"
              render={({ field: { value } }) => (
                <StyledView className="mb-4">
                  <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                    Type (Auto-detected)
                  </StyledText>
                  <StyledView className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                    <StyledText className="text-dark dark:text-white">
                      {(value || "").toUpperCase()}
                    </StyledText>
                  </StyledView>
                </StyledView>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <StyledView className="mb-4">
                  <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </StyledText>
                  <StyledTextInput
                    className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-dark dark:text-white"
                    placeholder="e.g., Robinhood account, Bank of America savings"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="sentences"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </StyledView>
              )}
            />

            <StyledTouchableOpacity
              onPress={handleSubmit(handleFormSubmit)}
              className="bg-primary p-3 rounded-lg flex-row justify-center items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <StyledText className="text-white text-center font-semibold">
                  Add Asset
                </StyledText>
              )}
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </Modal>
    </>
  );
};
