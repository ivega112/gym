const { jsPDF } = require("jspdf");

async function test() {
  const doc = new jsPDF();
  // Fetch Cairo font
  const fs = require('fs');
  // We need to run this in a browser-like environment or use node fetch
}
