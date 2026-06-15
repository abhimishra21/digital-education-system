// Test cycle normalization
const cycle = "SECOND+SEMESTER";
const normalizedCycle = cycle ? decodeURIComponent(cycle.replace(/\+/g, '%20')) : cycle;

console.log('Original cycle:', cycle);
console.log('Normalized cycle:', normalizedCycle);
console.log('Expected cycle:', 'SECOND SEMESTER');
console.log('Match:', normalizedCycle === 'SECOND SEMESTER');
