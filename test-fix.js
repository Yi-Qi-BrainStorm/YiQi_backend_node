// 测试修复的API脚本
const fetch = require('node-fetch');
const FormData = require('form-data');

// 测试使用 form-data 的注册
async function testRegisterWithFormData() {
  try {
    console.log('测试使用 form-data 的注册...');
    
    // 创建 form-data
    const form = new FormData();
    form.append('username', 'formuser');
    form.append('password', 'formpassword123');
    
    const response = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      body: form
    });
    
    const data = await response.json();
    console.log('注册响应:', data);
    return data;
  } catch (error) {
    console.error('注册错误:', error);
  }
}

// 测试使用 JSON 的注册
async function testRegisterWithJSON() {
  try {
    console.log('测试使用 JSON 的注册...');
    
    const response = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'jsonuser',
        password: 'jsonpassword123'
      })
    });
    
    const data = await response.json();
    console.log('注册响应:', data);
    return data;
  } catch (error) {
    console.error('注册错误:', error);
  }
}

// 运行测试
async function runTests() {
  console.log('开始测试修复...');
  await testRegisterWithFormData();
  console.log('---');
  await testRegisterWithJSON();
}

runTests();