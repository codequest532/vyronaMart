// Test book creation with pricing data
const testBookData = {
  title: "Bible",
  author: "Christopher Nolan", 
  category: "Self Help",
  fixedCostPrice: 699,
  rentalPrice: 99,
  isbn: "978-test-123",
  copies: 1,
  publisher: "Test Publisher",
  publicationYear: "2024",
  language: "English"
};

async function testBookCreation() {
  try {
    console.log("Testing book creation with data:", testBookData);
    
    const response = await fetch('http://localhost:5000/api/vyronaread/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBookData)
    });

    const result = await response.json();
    console.log("Full response status:", response.status);
    console.log("Full response headers:", Object.fromEntries(response.headers.entries()));
    console.log("Book creation response:", JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log("✅ Book created successfully!");
      console.log("Physical book ID:", result.book?.id);
      console.log("Product ID:", result.product?.id);
      console.log("Response keys:", Object.keys(result));
    } else {
      console.log("❌ Book creation failed:", result.message);
    }
    
  } catch (error) {
    console.error("Error testing book creation:", error);
  }
}

testBookCreation();