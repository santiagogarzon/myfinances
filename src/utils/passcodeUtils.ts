import * as SecureStore from 'expo-secure-store';

const PASSCODE_STORAGE_KEY = '@app_passcode';

export const setPasscode = async (passcode: string): Promise<void> => {
  try {
    // console.log('Setting passcode...');
    await SecureStore.setItemAsync(PASSCODE_STORAGE_KEY, passcode);
    // console.log('Passcode set successfully.');
  } catch (error) {
    console.error('Error setting passcode:', error);
    throw new Error('Failed to set passcode.');
  }
};

export const checkPasscode = async (passcode: string): Promise<boolean> => {
  try {
    const storedPasscode = await SecureStore.getItemAsync(PASSCODE_STORAGE_KEY);
    if (storedPasscode === null) {
      // console.log('No passcode stored.');
      return false;
    }
    // console.log('Passcode checked.');
    return storedPasscode === passcode;
  } catch (error) {
    console.error('Error checking passcode:', error);
    throw new Error('Failed to check passcode.');
  }
};

export const hasPasscode = async (): Promise<boolean> => {
  try {
    const storedPasscode = await SecureStore.getItemAsync(PASSCODE_STORAGE_KEY);
    // console.log('Checking for passcode existence.');
    return storedPasscode !== null;
  } catch (error) {
    console.error('Error checking for passcode existence:', error);
    // Assuming an error means we can't confirm existence, treat as no passcode
    return false;
  }
};

export const removePasscode = async (): Promise<void> => {
  try {
    // console.log('Deleting passcode...');
    await SecureStore.deleteItemAsync(PASSCODE_STORAGE_KEY);
    // console.log('Passcode deleted successfully.');
  } catch (error) {
    console.error('Error deleting passcode:', error);
    throw new Error('Failed to delete passcode.');
  }
}; 