export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  // Check if it's a Gmail address
  if (email.toLowerCase().endsWith('@gmail.com')) {
    return { isValid: true };
  }
  
  return { isValid: false, message: 'Please use a Gmail address' };
}; 