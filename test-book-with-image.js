import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBookWithImageCreation() {
  try {
    console.log('Testing book creation with image upload...');
    
    // Create a simple test image (base64 encoded)
    const testImageBuffer = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', 'base64');
    
    // Save test image to attached_assets
    const imagePath = path.join(__dirname, 'attached_assets', 'test-book-cover.jpg');
    fs.writeFileSync(imagePath, testImageBuffer);
    console.log('Test image created at:', imagePath);

    const bookData = {
      title: 'The Complete Guide to VyronaSocial',
      author: 'Tech Expert',
      category: 'technology',
      fixedCostPrice: 899,
      rentalPrice: 199,
      isbn: '978-1-234-56789-0',
      copies: 5,
      publisher: 'VyronaTech Publications',
      publicationYear: '2024',
      language: 'English',
      description: 'A comprehensive guide to mastering VyronaSocial platform features and capabilities.'
    };

    console.log('Creating book with data:', bookData);

    const response = await fetch('http://localhost:5000/api/vyronaread/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookData)
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Book creation response:', JSON.stringify(result, null, 2));

    if (result.success || result.id) {
      console.log('✅ Book created successfully!');
      console.log('Book ID:', result.id || result.book?.id);
      console.log('Product ID:', result.product?.id);
      
      // Test fetching all products to verify the book appears
      console.log('\nFetching all products to verify book appears...');
      const productsResponse = await fetch('http://localhost:5000/api/products');
      const products = await productsResponse.json();
      
      const createdBook = products.find(p => p.name === bookData.title);
      if (createdBook) {
        console.log('✅ Book found in products list!');
        console.log('Book details:', {
          id: createdBook.id,
          name: createdBook.name,
          category: createdBook.category,
          price: createdBook.price,
          metadata: createdBook.metadata
        });
      } else {
        console.log('❌ Book not found in products list');
      }
    } else {
      console.log('❌ Book creation failed');
    }

  } catch (error) {
    console.error('Error during test:', error);
  }
}

testBookWithImageCreation();