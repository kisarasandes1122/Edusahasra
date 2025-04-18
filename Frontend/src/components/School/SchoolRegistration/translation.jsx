// translation.jsx - Updated with all keys for SchoolRegistration

const translations = {
  en: {
    title: "School Registration",
    subtitle: "Register your school to join our educational support program",
    // Step 1
    schoolInfo: "School Information",
    schoolName: "School Name",
    schoolEmail: "School Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    passwordRequirements: "Password must contain:",
    min8Chars: "At least 8 characters",
    oneUppercase: "One uppercase letter",
    oneLowercase: "One lowercase letter",
    oneNumber: "One number",
    oneSpecialChar: "One special character (!@#$%^&*...)",
    // Step 2
    schoolAddress: "School Address",
    addressSubtitle: "Please provide your school's official address",
    streetAddress: "Street Address",
    city: "City",
    district: "District", // Used for label/error if needed
    selectDistrict: "Select District", // Placeholder for dropdown
    province: "Province",
    postalCode: "Postal Code",
    additionalRemarks: "Additional Remarks (optional)",
    // Step 3
    location: "School Location",
    locationSubtitle: "We'll use this location to show your school on the map for donors. This can be different from your registered address.",
    getLocation: "Get My Location",
    gettingLocation: "Getting Location...",
    locationNote: "If you're not currently at the school location, you can skip this step and provide the coordinates later.",
    latitude: "Latitude",
    longitude: "Longitude",
    getCoordinates: "Get School's GPS Coordinates",
    coordinatesInfo: "Click the button below to automatically detect your current location.",
    // Step 4
    principalInfo: "Principal / Contact Person Details",
    name: "Full Name",
    email: "Email Address",
    phoneNumber: "Phone Number",
    // Step 5
    documentVerification: "School Verification Documents",
    dropFiles: "Drop files here or click to upload",
    allowedFormats: "Accepted formats: PDF, JPG, PNG (Max 5MB each)",
    uploadedFilesTitle: "Uploaded Files", // Title for the list
    termsAgreement: "I agree to the terms and conditions and privacy policy",
    verificationNote: "Your registration will be reviewed and verified within 2-3 business days. You will receive a confirmation email once approved.",
    // Buttons & Navigation
    registerButton: "Register School",
    submittingButton: "Submitting...", // Text while submitting
    nextButton: "Next", // Renamed from 'next' for clarity
    previousButton: "Previous", // Renamed from 'previous' for clarity
    // Step Labels for Progress Bar
    step1Label: "School Info", // Renamed from 'step1'
    step2Label: "Address", // Renamed from 'step2'
    step3Label: "Location", // Renamed from 'step3'
    step4Label: "Principal", // Renamed from 'step4'
    step5Label: "Verification", // Renamed from 'step5'
  },
  si: {
    title: "පාසල් ලියාපදිංචිය",
    subtitle: "අපගේ අධ්‍යාපන සහාය වැඩසටහනට සම්බන්ධ වීමට ඔබේ පාසල ලියාපදිංචි කරන්න",
    // Step 1
    schoolInfo: "පාසල් තොරතුරු",
    schoolName: "පාසලේ නම",
    schoolEmail: "පාසල් විද්‍යුත් තැපෑල",
    password: "මුරපදය",
    confirmPassword: "මුරපදය තහවුරු කරන්න",
    passwordRequirements: "මුරපදයේ අඩංගු විය යුතුය:",
    min8Chars: "අවම වශයෙන් අක්ෂර 8ක්",
    oneUppercase: "එක් ලොකු අකුරක් (Uppercase)",
    oneLowercase: "එක් කුඩා අකුරක් (Lowercase)",
    oneNumber: "එක් ඉලක්කමක්",
    oneSpecialChar: "එක් විශේෂ අක්ෂරයක් (!@#$%^&*...)",
    // Step 2
    schoolAddress: "පාසල් ලිපිනය",
    addressSubtitle: "කරුණාකර ඔබේ පාසලේ නිල ලිපිනය සපයන්න",
    streetAddress: "වීදි ලිපිනය",
    city: "නගරය",
    district: "දිස්ත්‍රික්කය", // Used for label/error if needed
    selectDistrict: "දිස්ත්‍රික්කය තෝරන්න", // Placeholder for dropdown
    province: "පළාත",
    postalCode: "තැපැල් කේතය",
    additionalRemarks: "අමතර සටහන් (විකල්ප)",
    // Step 3
    location: "පාසල් ස්ථානය",
    locationSubtitle: "පරිත්‍යාගශීලීන්ට පෙන්වීම සඳහා අපි මෙම ස්ථානය සිතියමේ ඔබේ පාසල පෙන්වීමට භාවිතා කරන්නෙමු. මෙය ඔබේ ලියාපදිංචි ලිපිනයෙන් වෙනස් විය හැකිය.",
    getLocation: "මගේ ස්ථානය ලබා ගන්න",
    gettingLocation: "ස්ථානය ලබා ගනිමින්...",
    locationNote: "ඔබ දැනට පාසල් ස්ථානයේ නොමැති නම්, ඔබට මෙම පියවර මඟ හැර පසුව ඛණ්ඩාංක සැපයිය හැකිය.",
    latitude: "අක්ෂාංශ",
    longitude: "දේශාංශ",
    getCoordinates: "පාසලේ GPS ඛණ්ඩාංක ලබා ගන්න",
    coordinatesInfo: "ඔබේ වත්මන් ස්ථානය ස්වයංක්‍රීයව හඳුනා ගැනීමට පහත බොත්තම ක්ලික් කරන්න.",
    // Step 4
    principalInfo: "විදුහල්පති / සම්බන්ධතා පුද්ගල විස්තර",
    name: "සම්පූර්ණ නම",
    email: "විද්‍යුත් තැපැල් ලිපිනය",
    phoneNumber: "දුරකථන අංකය",
    // Step 5
    documentVerification: "පාසල් සත්‍යාපන ලේඛන",
    dropFiles: "ගොනු මෙහි දමන්න හෝ උඩුගත කිරීමට ක්ලික් කරන්න",
    allowedFormats: "පිළිගත් ආකෘති: PDF, JPG, PNG (උපරිම 5MB එකකට)",
    uploadedFilesTitle: "උඩුගත කළ ගොනු", // Title for the list
    termsAgreement: "මම නියමන සහ කොන්දේසි සහ පෞද්ගලිකත්ව ප්‍රතිපත්තියට එකඟ වෙමි",
    verificationNote: "ඔබේ ලියාපදිංචිය ව්‍යාපාරික දින 2-3ක් ඇතුළත සමාලෝචනය කර සත්‍යාපනය කරනු ලැබේ. අනුමත වූ පසු ඔබට තහවුරු කිරීමේ විද්‍යුත් තැපෑලක් ලැබෙනු ඇත.",
    // Buttons & Navigation
    registerButton: "පාසල ලියාපදිංචි කරන්න",
    submittingButton: "ඉදිරිපත් කරමින්...", // Text while submitting
    nextButton: "ඊළඟ", // Renamed from 'next' for clarity
    previousButton: "පෙර", // Renamed from 'previous' for clarity
    // Step Labels for Progress Bar
    step1Label: "පාසල් තොරතුරු", // Renamed from 'step1'
    step2Label: "ලිපිනය", // Renamed from 'step2'
    step3Label: "ස්ථානය", // Renamed from 'step3'
    step4Label: "විදුහල්පති", // Renamed from 'step4'
    step5Label: "සත්‍යාපනය", // Renamed from 'step5'
  }
};

export default translations;