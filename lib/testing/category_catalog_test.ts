import { dataStore } from '../data/store';
import { INITIAL_CATEGORIES } from '../taxonomy/catalog';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runCategoryTests() {
  console.log('🧪 Starting Category & Catalog Taxonomy Tests...\n');

  // Test 1: Baseline categories exist
  const initialCats = dataStore.getAllCategories();
  assert(initialCats.length >= INITIAL_CATEGORIES.length, `Expected at least ${INITIAL_CATEGORIES.length} baseline categories, found ${initialCats.length}`);
  assert(initialCats.some(c => c.id === 'cat-plumbing'), 'Plumbing baseline category is present');
  assert(initialCats.some(c => c.id === 'cat-electrical'), 'Electrical baseline category is present');

  // Test 2: Add Custom Category
  const testCat = dataStore.addCustomCategory({
    name: 'Appliance Repair & Electronics',
    description: 'Washing machine, refrigerator, TV, microwave and kitchen appliance servicing',
    icon: 'Cpu',
  });

  assert(Boolean(testCat && testCat.id), 'Custom category created with valid ID');
  assert(testCat.id === 'cat-appliance-repair-electronics', `Custom category ID formatted correctly: ${testCat.id}`);
  assert(testCat.slug === 'appliance-repair-electronics', `Custom category slug formatted correctly: ${testCat.slug}`);
  assert(testCat.icon === 'Cpu', 'Custom category icon is Cpu');

  // Test 3: Check custom category in getAllCategories
  const allCatsAfterAdd = dataStore.getAllCategories();
  assert(allCatsAfterAdd.some(c => c.id === testCat.id), 'Newly added category is in getAllCategories()');

  // Test 4: Add a Custom Service assigned to this Custom Category
  const customService = dataStore.addCustomService({
    name: 'Washing Machine Drum Descale & Service',
    category_id: testCat.id,
    description: 'Complete front/top load drum descaling, vibration check, and water inlet valve cleaning',
    price_estimate: 'From ₹449',
  });

  assert(Boolean(customService && customService.id), 'Custom service created successfully');
  assert(customService.category_id === testCat.id, `Custom service assigned to category ${testCat.id}`);

  // Test 5: Verify service is returned in getAllServices
  const allServices = dataStore.getAllServices();
  const foundService = allServices.find(s => s.id === customService.id);
  assert(Boolean(foundService), 'Custom service found in dataStore.getAllServices()');
  assert(foundService?.price_estimate === 'From ₹449', 'Price estimate matches');

  // Test 6: Delete Custom Category
  const deleted = dataStore.deleteCustomCategory(testCat.id);
  assert(deleted === true, 'deleteCustomCategory returned true');
  const allCatsAfterDelete = dataStore.getAllCategories();
  assert(!allCatsAfterDelete.some(c => c.id === testCat.id), 'Deleted category is no longer in getAllCategories()');

  // Clean up test service
  dataStore.deleteCustomService(customService.id);

  console.log('\n🎉 ALL 10/10 CATEGORY TAXONOMY TESTS PASSED SUCCESSFULLY!');
}

runCategoryTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

