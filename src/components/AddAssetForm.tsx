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
  KeyboardAvoidingView,
  Platform,
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
const StyledKeyboardAvoidingView = styled(KeyboardAvoidingView);

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
  // For very small numbers (less than 0.01), show more decimal places
  if (value > 0 && value < 0.01) {
    // Count how many leading zeros after the decimal point
    const decimalStr = value.toFixed(20); // Use a large number of decimals to start
    const match = decimalStr.match(/^0\.0*/);
    const leadingZeros = match ? match[0].length - 2 : 0; // -2 because of "0."

    // Show 2 more digits than the leading zeros
    const minFractionDigits = Math.min(leadingZeros + 2, 8); // Cap at 8 decimal places

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: minFractionDigits,
    }).format(value);
  }

  // For normal numbers, use standard 2 decimal places
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

  const handleSymbolChange = useCallback(
    (text: string, onChange: (value: string) => void) => {
      onChange(text);

      // Clear any existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(async () => {
        try {
          const upperText = text.toUpperCase();
          const newSuggestions = getAssetSuggestions(text);
          setSuggestions(newSuggestions);
          setShowSuggestions(newSuggestions.length > 0);

          let detectedType = assetType;

          // If there's an exact match, auto-detect the type
          const exactMatch = newSuggestions.find((s) => s.symbol === upperText);
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
              if (
                priceData &&
                priceData.price !== undefined &&
                priceData.price !== null
              ) {
                setCurrentPrice(priceData.price);
                setPriceError(null);
              } else {
                // Only set price error if there's no valid price data
                setPriceError("Could not fetch price for symbol.");
                setCurrentPrice(null);
              }
            } catch (error) {
              console.error(
                "AddAssetForm: Error fetching price (debounce):",
                error
              );
              setPriceError(
                error instanceof Error ? error.message : "Failed to fetch price"
              );
              setCurrentPrice(null);
            } finally {
              setIsLoadingPrice(false);
            }
          } else {
            // Clear price info if symbol is empty or type is not price-fetchable
            setCurrentPrice(null);
            setPriceError(null);
            setIsLoadingPrice(false);
          }
          // --- End Price Fetch Logic ---
        } catch (error) {
          console.error("Error in handleSymbolChange debounce:", error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to process symbol. Please try again.",
          });
          setIsLoadingPrice(false);
        }
      }, DEBOUNCE_DELAY);
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
            if (
              priceData &&
              priceData.price !== undefined &&
              priceData.price !== null
            ) {
              setCurrentPrice(priceData.price);
              setPriceError(null);
            } else {
              setPriceError("Could not fetch price for symbol.");
              setCurrentPrice(null);
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
          }
        } else {
          // Clear price info if symbol is empty or type is not price-fetchable
          setCurrentPrice(null);
          setPriceError(null);
          setIsLoadingPrice(false);
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
        className="bg-blue-600 dark:bg-blue-500 p-4 rounded-lg shadow-sm mb-4 flex-row items-center justify-center"
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
        <StyledKeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <StyledView className="flex-1 bg-black/50 justify-center items-center p-4">
            <StyledView
              className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg p-4"
              style={{
                elevation: 5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}
            >
              <StyledView className="flex-row justify-between items-center mb-4">
                <StyledText className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add New Asset
                </StyledText>
                <StyledTouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color="#6B7280"
                    className="dark:text-gray-400"
                  />
                </StyledTouchableOpacity>
              </StyledView>

              <StyledView>
                <Controller
                  control={control}
                  name="type"
                  render={({ field: { onChange, value } }) => (
                    <StyledView className="mb-4">
                      <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                        Type
                      </StyledText>
                      <StyledView className="flex-row flex-wrap gap-2">
                        {ASSET_TYPES.map((type) => (
                          <StyledTouchableOpacity
                            key={type}
                            onPress={() => onChange(type)}
                            className={`px-3 py-2 rounded-lg ${
                              value === type
                                ? "bg-blue-600 dark:bg-blue-500"
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          >
                            <StyledText
                              className={`${
                                value === type
                                  ? "text-white"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {type.toUpperCase()}
                            </StyledText>
                          </StyledTouchableOpacity>
                        ))}
                      </StyledView>
                    </StyledView>
                  )}
                />

                <Controller
                  control={control}
                  name="symbol"
                  rules={{ required: "Symbol is required" }}
                  render={({ field: { onChange, value } }) => (
                    <StyledView className="mb-4">
                      <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                        Symbol
                      </StyledText>
                      <StyledView>
                        <StyledTextInput
                          ref={inputRef}
                          className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
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
                          autoCapitalize={
                            assetType === "cash" ? "characters" : "none"
                          }
                        />
                      </StyledView>
                      {showSuggestions &&
                        suggestions.length > 0 &&
                        !isSelecting && (
                          <StyledView
                            className="mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            style={{
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.25,
                              shadowRadius: 3.84,
                              elevation: 5,
                              height: 160, // Height for 4 items (40px per item)
                            }}
                          >
                            <StyledScrollView
                              showsVerticalScrollIndicator={true}
                              nestedScrollEnabled={true}
                            >
                              {suggestions.map((suggestion, index) => (
                                <StyledTouchableOpacity
                                  key={suggestion.symbol}
                                  onPress={() =>
                                    handleSuggestionSelect(suggestion)
                                  }
                                  className={`p-3 ${
                                    index !== suggestions.length - 1
                                      ? "border-b border-gray-200 dark:border-gray-700"
                                      : ""
                                  } active:bg-gray-100 dark:active:bg-gray-700`}
                                >
                                  <StyledView className="flex-row justify-between items-center">
                                    <StyledView>
                                      <StyledText className="text-gray-900 dark:text-white font-medium">
                                        {suggestion.symbol}
                                      </StyledText>
                                      <StyledText className="text-gray-500 dark:text-gray-400 text-sm">
                                        {suggestion.name}
                                      </StyledText>
                                    </StyledView>
                                    <StyledText className="text-gray-500 dark:text-gray-400 text-sm">
                                      {suggestion.type.toUpperCase()}
                                    </StyledText>
                                  </StyledView>
                                </StyledTouchableOpacity>
                              ))}
                            </StyledScrollView>
                          </StyledView>
                        )}
                      {errors.symbol && (
                        <StyledText className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {errors.symbol.message}
                        </StyledText>
                      )}
                      {priceError && (
                        <StyledText className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {priceError}
                        </StyledText>
                      )}
                    </StyledView>
                  )}
                />

                {assetType === "cash" && (
                  <Controller
                    control={control}
                    name="currency"
                    rules={{ required: "Currency is required" }}
                    render={({ field: { onChange, value } }) => (
                      <StyledView className="mb-4">
                        <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                          Currency
                        </StyledText>
                        <StyledTextInput
                          className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
                          placeholder="e.g., USD"
                          placeholderTextColor="#9CA3AF"
                          onChangeText={onChange}
                          value={value}
                          autoCapitalize="characters"
                        />
                        {errors.currency && (
                          <StyledText className="text-red-600 dark:text-red-400 text-sm mt-1">
                            {errors.currency.message}
                          </StyledText>
                        )}
                      </StyledView>
                    )}
                  />
                )}

                <Controller
                  control={control}
                  name="quantity"
                  rules={{ required: "Quantity is required" }}
                  render={({ field: { onChange, value } }) => (
                    <StyledView className="mb-4">
                      <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                        Quantity
                      </StyledText>
                      <StyledTextInput
                        className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
                        placeholder="e.g., 10"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={onChange}
                        value={value}
                        keyboardType="decimal-pad"
                      />
                      {errors.quantity && (
                        <StyledText className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {errors.quantity.message}
                        </StyledText>
                      )}
                    </StyledView>
                  )}
                />

                <Controller
                  control={control}
                  name="buyPrice"
                  rules={{ required: "Buy price is required" }}
                  render={({ field: { onChange, value } }) => (
                    <StyledView className="mb-4">
                      <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                        Buy Price
                      </StyledText>
                      <StyledTextInput
                        className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
                        placeholder="e.g., 150.50"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={onChange}
                        value={value}
                        keyboardType="decimal-pad"
                      />
                      {errors.buyPrice && (
                        <StyledText className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {errors.buyPrice.message}
                        </StyledText>
                      )}
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
                        className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
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

                {(assetType === "stock" ||
                  assetType === "etf" ||
                  assetType === "crypto" ||
                  assetType === "cash") &&
                  parseFloat(quantity || "0") > 0 &&
                  symbol.trim() !== "" && (
                    <StyledView className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {isLoadingPrice ? (
                        <StyledView className="flex-row items-center justify-center">
                          <ActivityIndicator size="small" color="#6B7280" />
                          <StyledText className="text-gray-600 dark:text-gray-300 ml-2">
                            Fetching price...
                          </StyledText>
                        </StyledView>
                      ) : priceError ? (
                        <StyledText className="text-red-600 dark:text-red-400 text-sm">
                          {priceError}
                        </StyledText>
                      ) : currentPrice !== null ? (
                        <>
                          <StyledView className="flex-row justify-between mb-1">
                            <StyledText className="text-gray-600 dark:text-gray-300">
                              Current Market Price:
                            </StyledText>
                            <StyledText className="text-gray-900 dark:text-white font-semibold">
                              {formatCurrency(currentPrice)}
                            </StyledText>
                          </StyledView>
                          <StyledView className="flex-row justify-between">
                            <StyledText className="text-gray-600 dark:text-gray-300">
                              Total Value:
                            </StyledText>
                            <StyledText className="text-blue-600 dark:text-blue-400 font-semibold">
                              {formatCurrency(totalValue)}
                            </StyledText>
                          </StyledView>
                        </>
                      ) : null}
                    </StyledView>
                  )}

                <StyledTouchableOpacity
                  onPress={handleSubmit(handleFormSubmit)}
                  className="bg-blue-600 dark:bg-blue-500 p-3 rounded-lg flex-row justify-center items-center"
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
          </StyledView>
        </StyledKeyboardAvoidingView>
      </Modal>
    </>
  );
};
