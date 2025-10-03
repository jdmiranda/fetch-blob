import { Blob } from './index.js'
import { performance } from 'node:perf_hooks'

// Benchmark utilities
function benchmark(name, fn, iterations = 10000) {
  // Warmup
  for (let i = 0; i < 100; i++) fn()

  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  const end = performance.now()
  const duration = end - start
  const opsPerSec = (iterations / duration) * 1000

  console.log(`${name}:`)
  console.log(`  Total time: ${duration.toFixed(2)}ms`)
  console.log(`  Ops/sec: ${opsPerSec.toFixed(0)}`)
  console.log(`  Avg time per op: ${(duration / iterations).toFixed(4)}ms`)
  console.log()
}

async function benchmarkAsync(name, fn, iterations = 1000) {
  // Warmup
  for (let i = 0; i < 10; i++) await fn()

  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    await fn()
  }
  const end = performance.now()
  const duration = end - start
  const opsPerSec = (iterations / duration) * 1000

  console.log(`${name}:`)
  console.log(`  Total time: ${duration.toFixed(2)}ms`)
  console.log(`  Ops/sec: ${opsPerSec.toFixed(0)}`)
  console.log(`  Avg time per op: ${(duration / iterations).toFixed(4)}ms`)
  console.log()
}

console.log('=== Blob Performance Benchmarks ===\n')

// Test 1: Blob creation from Buffer
console.log('--- Blob Creation Tests ---')
const testBuffer = Buffer.from('Hello World'.repeat(100))
benchmark('Blob from Buffer (1KB)', () => {
  new Blob([testBuffer])
}, 50000)

// Test 2: Blob creation from Uint8Array
const testUint8 = new Uint8Array(1024)
benchmark('Blob from Uint8Array (1KB)', () => {
  new Blob([testUint8])
}, 50000)

// Test 3: Blob creation from string
const testString = 'Hello World'.repeat(100)
benchmark('Blob from String (1KB)', () => {
  new Blob([testString])
}, 50000)

// Test 4: Blob creation from multiple parts
const parts = [
  Buffer.from('part1'),
  new Uint8Array([1, 2, 3, 4, 5]),
  'string part',
  Buffer.from('part2')
]
benchmark('Blob from mixed parts', () => {
  new Blob(parts)
}, 50000)

// Test 5: Blob creation with empty parts (should be filtered)
benchmark('Blob with empty parts', () => {
  new Blob(['', Buffer.alloc(0), 'data', new Uint8Array(0)])
}, 50000)

// Test 6: Slice operations
console.log('--- Slice Operation Tests ---')
const largeBlob = new Blob([Buffer.alloc(10240)])

benchmark('Slice entire blob (fast path)', () => {
  largeBlob.slice()
}, 100000)

benchmark('Slice first half', () => {
  largeBlob.slice(0, 5120)
}, 100000)

benchmark('Slice middle portion', () => {
  largeBlob.slice(2560, 7680)
}, 100000)

benchmark('Slice small chunk', () => {
  largeBlob.slice(100, 200)
}, 100000)

benchmark('Slice with negative indices', () => {
  largeBlob.slice(-1000, -100)
}, 100000)

// Test 7: Multiple sequential slices
benchmark('Sequential slices', () => {
  const b1 = largeBlob.slice(0, 8192)
  const b2 = b1.slice(0, 4096)
  const b3 = b2.slice(0, 2048)
}, 50000)

// Test 8: Async operations
console.log('--- Async Conversion Tests ---')

const asyncBlob = new Blob([Buffer.alloc(1024)])
await benchmarkAsync('text() conversion (1KB)', async () => {
  await asyncBlob.text()
}, 5000)

await benchmarkAsync('arrayBuffer() conversion (1KB)', async () => {
  await asyncBlob.arrayBuffer()
}, 5000)

// Test 9: Larger async conversions
const largeAsyncBlob = new Blob([Buffer.alloc(102400)]) // 100KB
await benchmarkAsync('text() conversion (100KB)', async () => {
  await largeAsyncBlob.text()
}, 500)

await benchmarkAsync('arrayBuffer() conversion (100KB)', async () => {
  await largeAsyncBlob.arrayBuffer()
}, 500)

// Test 10: Stream performance
console.log('--- Stream Tests ---')
const streamBlob = new Blob([Buffer.alloc(10240)])
await benchmarkAsync('stream() iteration', async () => {
  const reader = streamBlob.stream().getReader()
  while (true) {
    const { done } = await reader.read()
    if (done) break
  }
}, 1000)

// Test 11: Type checking performance
console.log('--- Type Checking Tests ---')
const typeBlob = new Blob(['test'], { type: 'text/plain' })
benchmark('Get size property', () => {
  const s = typeBlob.size
}, 1000000)

benchmark('Get type property', () => {
  const t = typeBlob.type
}, 1000000)

// Test 12: Multiple Blob construction patterns
console.log('--- Construction Patterns ---')
const smallData = Buffer.from('small')
benchmark('Many small blobs', () => {
  for (let i = 0; i < 10; i++) {
    new Blob([smallData])
  }
}, 10000)

const largeData = Buffer.alloc(65536)
benchmark('Large blob (64KB)', () => {
  new Blob([largeData])
}, 10000)

// Test 13: Slice and combine pattern
console.log('--- Slice and Combine Pattern ---')
const baseBlob = new Blob([Buffer.alloc(10240)])
benchmark('Slice + new Blob combination', () => {
  const part1 = baseBlob.slice(0, 5120)
  const part2 = baseBlob.slice(5120)
  new Blob([part1, part2])
}, 10000)

console.log('=== Benchmarks Complete ===')
