/**
 * Performance test script for bundle size and runtime performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle size analysis
function analyzeBundleSize() {
  const distDir = path.join(__dirname, '../dist');
  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
  
  console.log('📦 Bundle Size Analysis');
  console.log('======================');
  
  const sizes = {};
  
  files.forEach(file => {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
    sizes[file] = sizeKB;
  });
  
  // Sort by size
  const sortedSizes = Object.entries(sizes)
    .sort(([,a], [,b]) => b - a);
  
  sortedSizes.forEach(([file, size]) => {
    console.log(`${file.padEnd(20)} ${size.toString().padStart(8)} KB`);
  });
  
  const totalSize = Object.values(sizes).reduce((sum, size) => sum + size, 0);
  console.log(''.padEnd(30, '-'));
  console.log(`Total: ${totalSize.toFixed(2)} KB`);
  
  return sizes;
}

// Performance benchmarks
function runPerformanceTests() {
  console.log('\n⚡ Performance Tests');
  console.log('===================');
  
  // Test 1: Error creation performance
  console.log('\n1. Error Creation Performance');
  const iterations = 100000;
  
  const start1 = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    new Error(`Test error ${i}`);
  }
  const end1 = process.hrtime.bigint();
  const time1 = Number(end1 - start1) / 1000000; // Convert to ms
  
  console.log(`   Standard Error: ${time1.toFixed(2)}ms (${(iterations/time1*1000).toFixed(0)} ops/sec)`);
  
  // Test 2: JSON serialization performance
  console.log('\n2. JSON Serialization Performance');
  const testError = new Error('Test error');
  testError.code = 'TEST_ERROR';
  testError.statusCode = 400;
  testError.context = { userId: '123', operation: 'test' };
  
  const start2 = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    JSON.stringify(testError);
  }
  const end2 = process.hrtime.bigint();
  const time2 = Number(end2 - start2) / 1000000;
  
  console.log(`   JSON.stringify: ${time2.toFixed(2)}ms (${(iterations/time2*1000).toFixed(0)} ops/sec)`);
  
  // Test 3: Memory usage
  console.log('\n3. Memory Usage');
  const memBefore = process.memoryUsage();
  
  const errors = [];
  for (let i = 0; i < 10000; i++) {
    errors.push(new Error(`Test error ${i}`));
  }
  
  const memAfter = process.memoryUsage();
  const memUsed = memAfter.heapUsed - memBefore.heapUsed;
  
  console.log(`   Memory used: ${(memUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Per error: ${(memUsed / errors.length).toFixed(2)} bytes`);
}

// Tree shaking analysis
function analyzeTreeShaking() {
  console.log('\n🌳 Tree Shaking Analysis');
  console.log('========================');
  
  // Check if modular bundles exist
  const modularBundles = [
    'core.js', 'core.esm.js',
    'factories.js', 'factories.esm.js',
    'express.js', 'express.esm.js',
    'hono.js', 'hono.esm.js',
    'fastify.js', 'fastify.esm.js',
    'patterns.js', 'patterns.esm.js',
    'metrics.js', 'metrics.esm.js',
    'cache.js', 'cache.esm.js'
  ];
  
  const distDir = path.join(__dirname, '../dist');
  const existingBundles = modularBundles.filter(bundle => 
    fs.existsSync(path.join(distDir, bundle))
  );
  
  console.log(`Modular bundles created: ${existingBundles.length}/${modularBundles.length}`);
  
  if (existingBundles.length > 0) {
    console.log('\nAvailable modular imports:');
    existingBundles.forEach(bundle => {
      const bundleName = bundle.replace(/\.(js|esm\.js)$/, '');
      console.log(`  import { ... } from '@osmanekrem/error-handler/${bundleName}';`);
    });
  }
}

// Main execution
function main() {
  console.log('🚀 Error Handler Performance Analysis');
  console.log('=====================================\n');
  
  try {
    const sizes = analyzeBundleSize();
    runPerformanceTests();
    analyzeTreeShaking();
    
    console.log('\n✅ Analysis completed successfully!');
    
    // Save results to file
    const results = {
      timestamp: new Date().toISOString(),
      bundleSizes: sizes,
      totalSize: Object.values(sizes).reduce((sum, size) => sum + size, 0)
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../dist/performance-results.json'),
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n📊 Results saved to dist/performance-results.json');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  analyzeBundleSize,
  runPerformanceTests,
  analyzeTreeShaking
};
