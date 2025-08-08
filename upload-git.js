import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Handle __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input and output file paths
const inputFile = path.join(__dirname, "contacts.vcf"); // Your original file
const outputFile = path.join(__dirname, "fixed_contacts.vcf"); // Fixed file

// Read the original file
let vcfData = fs.readFileSync(inputFile, "utf8");

// Convert NOTE with phone numbers into TEL
let fixedVcf = vcfData.replace(
  /NOTE:Phone Numbers\\: *\+?([0-9]+)/g,
  (match, number) => `TEL;TYPE=CELL:+${number}`
);

// Remove any trailing "\n" artifacts inside TEL
fixedVcf = fixedVcf.replace(/\\n/g, "");

// Save the fixed vCard
fs.writeFileSync(outputFile, fixedVcf, "utf8");

console.log("✅ Fixed contacts saved as:", outputFile);
