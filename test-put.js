const fs = require('fs');

async function test() {
  const url = 'https://zztcxiiptdbkfwlflgdh.supabase.co/storage/v1/object/upload/sign/cardbound-media/test-123.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85MmQ3NmYxZS01ZWRmLTQyNWEtYmVhNS1hNzYzM2UzOGEyOTgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXJkYm91bmQtbWVkaWEvdGVzdC0xMjMuanBnIiwidXBzZXJ0IjpmYWxzZSwiaWF0IjoxNzgwMzQ5NzQyLCJleHAiOjE3ODAzNTY5NDJ9.EvAzwARsgoXJYA0FzlS0F3s70Zda_nJF5eQXHh3spLs';
  
  const blob = Buffer.from('hello world');
  console.log("Uploading blob...");
  const res = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": "image/jpeg" }
  });
  
  const text = await res.text();
  console.log("Result:", res.status, res.statusText, text);
}

test().catch(console.error);
