import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Modal,
} from "react-native";
import { Controller } from "react-hook-form";
import { useAddAssetForm } from "../hooks/useAddAssetForm";
import { AssetType } from "../types";
import {
  getAssetSuggestions,
  detectAssetType,
  getAssetName,
} from "../utils/assetUtils";

const ASSET_TYPES: AssetType[] = ["stock", "etf", "crypto", "cash"];
const DEBOUNCE_DELAY = 500;

export const AddAssetForm: React.FC = () => {
  const { control, handleSubmit, onSubmit, errors, setValue, watch } =
    useAddAssetForm();
  const [suggestions, setSuggestions] = useState<
    Array<{ symbol: string; name: string; type: AssetType }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputPosition, setInputPosition] = useState({ x: 0, y: 0, width: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Watch asset type to conditionally show currency input
  const assetType = watch("type");

  const handleSymbolChange = useCallback(
    (text: string, onChange: (value: string) => void) => {
      onChange(text);

      // Clear any existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        const newSuggestions = getAssetSuggestions(text);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);

        // If there's an exact match, auto-detect the type
        const exactMatch = newSuggestions.find(
          (s) => s.symbol === text.toUpperCase()
        );
        if (exactMatch) {
          setValue("type", exactMatch.type);
        } else {
          // Otherwise, try to detect type from the input
          setValue("type", detectAssetType(text));
        }
      }, DEBOUNCE_DELAY);
    },
    [setValue]
  );

  const handleSuggestionSelect = (suggestion: {
    symbol: string;
    name: string;
    type: AssetType;
  }) => {
    setIsSelecting(true);
    setShowSuggestions(false);
    setValue("symbol", suggestion.symbol);
    setValue("type", suggestion.type);
    // If cash is selected, also set the currency
    if (suggestion.type === "cash") {
      setValue("currency", suggestion.symbol); // Use symbol as currency code
    }
    Keyboard.dismiss();
    // Reset the selecting flag after a short delay
    setTimeout(() => setIsSelecting(false), 100);
  };

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

  return (
    <View className="bg-white dark:bg-dark p-4 rounded-lg shadow-sm mb-4">
      <Text className="text-xl font-semibold text-dark dark:text-white mb-4">
        Add New Asset
      </Text>

      <Controller
        control={control}
        name="symbol"
        rules={{ required: "Symbol is required" }}
        render={({ field: { onChange, value } }) => (
          <View className="mb-4">
            <Text className="text-gray-600 dark:text-gray-300 mb-1">
              Symbol
            </Text>
            <View className="relative">
              <TextInput
                ref={inputRef}
                className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-dark dark:text-white"
                placeholder={
                  assetType === "cash" ? "e.g., USD, EUR" : "e.g., AAPL, BTC"
                }
                placeholderTextColor="#9CA3AF"
                onChangeText={(text) => handleSymbolChange(text, onChange)}
                value={value}
                autoCapitalize={
                  assetType === "cash" ? "characters" : "all-characters"
                }
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
              />
              <Modal
                visible={showSuggestions && suggestions.length > 0}
                transparent
                animationType="none"
                onRequestClose={() => setShowSuggestions(false)}
              >
                <TouchableOpacity
                  className="flex-1"
                  activeOpacity={1}
                  onPress={() => setShowSuggestions(false)}
                >
                  <View
                    className="absolute bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                    style={{
                      top: inputPosition.y,
                      left: inputPosition.x,
                      width: inputPosition.width,
                      maxHeight: 200,
                    }}
                  >
                    <ScrollView
                      className="rounded-lg"
                      keyboardShouldPersistTaps="handled"
                    >
                      {suggestions.map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion.symbol}
                          className="p-3 border-b border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-800"
                          onPress={() => handleSuggestionSelect(suggestion)}
                        >
                          <Text className="text-dark dark:text-white font-semibold">
                            {suggestion.symbol}
                          </Text>
                          <Text className="text-gray-600 dark:text-gray-300 text-sm">
                            {suggestion.name} ({suggestion.type.toUpperCase()})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
            {errors.symbol && (
              <Text className="text-danger text-sm mt-1">
                {errors.symbol.message}
              </Text>
            )}
          </View>
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
          <View className="mb-4">
            <Text className="text-gray-600 dark:text-gray-300 mb-1">
              Quantity
            </Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-dark dark:text-white"
              placeholder="e.g., 10"
              placeholderTextColor="#9CA3AF"
              onChangeText={onChange}
              value={value}
              keyboardType="decimal-pad"
            />
            {errors.quantity && (
              <Text className="text-danger text-sm mt-1">
                {errors.quantity.message}
              </Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="type"
        render={({ field: { value } }) => (
          <View className="mb-4">
            <Text className="text-gray-600 dark:text-gray-300 mb-1">
              Type (Auto-detected)
            </Text>
            <View className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              <Text className="text-dark dark:text-white">
                {value.toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Conditional Currency Input for Cash */}
      {assetType === "cash" && (
        <Controller
          control={control}
          name="currency"
          rules={{ required: "Currency is required" }}
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-300 mb-1">
                Currency
              </Text>
              <TextInput
                className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-dark dark:text-white"
                placeholder="e.g., USD"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                value={value}
                autoCapitalize="characters"
              />
              {errors.currency && (
                <Text className="text-danger text-sm mt-1">
                  {errors.currency.message}
                </Text>
              )}
            </View>
          )}
        />
      )}

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        className="bg-primary p-3 rounded-lg"
      >
        <Text className="text-white text-center font-semibold">Add Asset</Text>
      </TouchableOpacity>
    </View>
  );
};
