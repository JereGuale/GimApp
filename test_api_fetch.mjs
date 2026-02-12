// Script para probar el endpoint de usuarios con token Bearer
import fetch from 'node-fetch';

const API_URL = 'http://localhost:8000/api/admin/users';
const TOKEN = '31|YjuCTmq4hWLIO15SssUabGsg0JFfLdjDcBWksBlkebe1006d'; // Token Bearer válido generado para super_admin

async function testFetch() {
  try {
    const res = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json',
      },
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testFetch();