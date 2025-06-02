import * as SecureStore from 'expo-secure-store';

const PASSCODE_STORAGE_KEY = '@app_passcode';

export const setPasscode = async (passcode: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(PASSCODE_STORAGE_KEY, passcode);
    console.log('Passcode stored successfully.');
  } catch (error) {
    console.error('Error storing passcode:', error);
    throw new Error('Failed to store passcode.');
  }
};

export const checkPasscode = async (passcode: string): Promise<boolean> => {
  try {
    const storedPasscode = await SecureStore.getItemAsync(PASSCODE_STORAGE_KEY);
    if (storedPasscode === null) {
      console.log('No passcode stored.');
      return false;
    }
    return storedPasscode === passcode;
  } catch (error) {
    console.error('Error checking passcode:', error);
    throw new Error('Failed to check passcode.');
  }
};

export const hasPasscode = async (): Promise<boolean> => {
  try {
    const storedPasscode = await SecureStore.getItemAsync(PASSCODE_STORAGE_KEY);
    return storedPasscode !== null;
  } catch (error) {
    console.error('Error checking for passcode existence:', error);
    // Assuming an error means we can't confirm existence, treat as no passcode
    return false;
  }
};

export const removePasscode = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(PASSCODE_STORAGE_KEY);
    console.log('Passcode removed successfully.');
  } catch (error) {
    console.error('Error removing passcode:', error);
    throw new Error('Failed to remove passcode.');
  }
}; 