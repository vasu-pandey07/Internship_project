const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\vasu pandey\\.gemini\\antigravity\\brain\\686c77ad-e093-4397-a5f1-c906aee8d294';
const dest = 'c:\\internship1\\client\\public\\categories';

if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

const files = {
  'web_development_1776188952885.png': 'web-development.png',
  'machine_learning_1776189002084.png': 'machine-learning.png',
  'data_science_1776189114666.png': 'data-science.png',
  'mobile_development_1776189131436.png': 'mobile-development.png',
  'cloud_computing_1776189230789.png': 'cloud-computing.png',
  'cybersecurity_1776189463522.png': 'cybersecurity.png',
  'ui_ux_design_1776189388240.png': 'ui-ux-design.png',
  'devops_1776189404664.png': 'devops.png',
  'business_1776189418195.png': 'business.png',
  'general_tech_1776189433838.png': 'other.png',
};

Object.entries(files).forEach(([srcFile, destFile]) => {
  const s = path.join(src, srcFile);
  const d = path.join(dest, destFile);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(`Copied: ${destFile}`);
  } else {
    console.log(`MISSING: ${srcFile}`);
  }
});

console.log('Done!');
