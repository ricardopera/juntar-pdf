/**
 * PDF Merger - Test Suite
 * Simple test functions to validate core functionality
 */

// Test utilities
function createTestPDF(name = 'test.pdf', sizeKB = 100) {
    // Create a simple PDF-like blob for testing
    const content = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF';
    const padding = 'x'.repeat(Math.max(0, (sizeKB * 1024) - content.length));
    return new File([content + padding], name, { type: 'application/pdf' });
}

function createNonPDFFile(name = 'test.txt') {
    return new File(['This is not a PDF'], name, { type: 'text/plain' });
}

function createLargeFile(name = 'large.pdf', sizeKB = 30000) {
    return createTestPDF(name, sizeKB);
}

// Test Suite
class PDFMergerTests {
    constructor() {
        this.testResults = [];
        this.app = window.app;
    }

    log(testName, passed, message = '') {
        const result = { testName, passed, message, timestamp: new Date() };
        this.testResults.push(result);
        console.log(`${passed ? '✅' : '❌'} ${testName}: ${message}`);
        return passed;
    }

    async runAllTests() {
        console.log('🧪 Starting PDF Merger Test Suite...\n');
        
        // Basic functionality tests
        await this.testFileValidation();
        await this.testFileAddition();
        await this.testFileRemoval();
        await this.testFileReordering();
        await this.testErrorHandling();
        await this.testUIStates();
        
        // Generate test report
        this.generateReport();
    }

    async testFileValidation() {
        console.log('\n📋 Testing File Validation...');
        
        // Test valid PDF
        const validPDF = createTestPDF('valid.pdf');
        const validResult = this.app.validateFile(validPDF);
        this.log('Valid PDF acceptance', validResult.isValid, 'Should accept valid PDF files');

        // Test invalid file type
        const invalidFile = createNonPDFFile('document.txt');
        const invalidResult = this.app.validateFile(invalidFile);
        this.log('Invalid file rejection', !invalidResult.isValid, 'Should reject non-PDF files');

        // Test large file
        const largeFile = createLargeFile('huge.pdf', 30000); // 30MB
        const largeResult = this.app.validateFile(largeFile);
        this.log('Large file handling', !largeResult.isValid, 'Should reject files over size limit');

        // Test duplicate file
        this.app.files = [{ file: validPDF, name: validPDF.name, size: validPDF.size }];
        const duplicateResult = this.app.validateFile(validPDF);
        this.log('Duplicate file detection', !duplicateResult.isValid, 'Should detect duplicate files');
        this.app.files = []; // Clean up
    }

    async testFileAddition() {
        console.log('\n📁 Testing File Addition...');
        
        const initialCount = this.app.files.length;
        const testFiles = [
            createTestPDF('file1.pdf', 100),
            createTestPDF('file2.pdf', 200),
            createTestPDF('file3.pdf', 150)
        ];

        this.app.addFiles(testFiles);
        const finalCount = this.app.files.length;
        
        this.log('Multiple file addition', 
            finalCount === initialCount + testFiles.length,
            `Added ${testFiles.length} files, count changed from ${initialCount} to ${finalCount}`
        );

        // Test file properties
        const addedFile = this.app.files.find(f => f.name === 'file1.pdf');
        this.log('File properties preservation',
            addedFile && addedFile.name === 'file1.pdf' && addedFile.status === 'pending',
            'File properties should be preserved during addition'
        );
    }

    async testFileRemoval() {
        console.log('\n🗑️ Testing File Removal...');
        
        // Ensure we have files to remove
        if (this.app.files.length === 0) {
            this.app.addFiles([createTestPDF('remove-test.pdf')]);
        }

        const initialCount = this.app.files.length;
        const fileToRemove = this.app.files[0];
        const fileId = fileToRemove.id;

        this.app.removeFile(fileId);
        const finalCount = this.app.files.length;
        const fileStillExists = this.app.files.some(f => f.id === fileId);

        this.log('Single file removal',
            finalCount === initialCount - 1 && !fileStillExists,
            `File count changed from ${initialCount} to ${finalCount}, file removed`
        );

        // Test clear all
        this.app.addFiles([createTestPDF('clear-test1.pdf'), createTestPDF('clear-test2.pdf')]);
        this.app.clearAllFiles();
        
        this.log('Clear all files',
            this.app.files.length === 0,
            'All files should be removed with clearAllFiles()'
        );
    }

    async testFileReordering() {
        console.log('\n🔄 Testing File Reordering...');
        
        // Set up test files
        const testFiles = [
            createTestPDF('first.pdf'),
            createTestPDF('second.pdf'),
            createTestPDF('third.pdf')
        ];
        this.app.addFiles(testFiles);

        const originalOrder = this.app.files.map(f => f.name);
        
        // Move first file to last position
        this.app.reorderFiles(0, 2);
        const newOrder = this.app.files.map(f => f.name);
        
        this.log('File reordering',
            newOrder[2] === originalOrder[0] && newOrder[0] === originalOrder[1],
            `Order changed from [${originalOrder.join(', ')}] to [${newOrder.join(', ')}]`
        );

        this.app.clearAllFiles(); // Clean up
    }

    async testErrorHandling() {
        console.log('\n⚠️ Testing Error Handling...');
        
        // Test invalid file handling
        const invalidFiles = [createNonPDFFile('bad.txt'), createLargeFile('huge.pdf', 60000)];
        const initialFileCount = this.app.files.length;
        
        // This should trigger error handling without adding files
        this.app.handleFileSelect(invalidFiles);
        
        this.log('Invalid file error handling',
            this.app.files.length === initialFileCount,
            'Invalid files should not be added to the list'
        );

        // Test empty merge attempt
        this.app.clearAllFiles();
        this.app.mergeFiles(); // Should not crash
        
        this.log('Empty merge handling',
            !this.app.isProcessing,
            'Should handle empty merge gracefully'
        );
    }

    async testUIStates() {
        console.log('\n🖥️ Testing UI States...');
        
        // Test empty state
        this.app.clearAllFiles();
        this.app.updateUI();
        
        const mergeButtonDisabled = this.app.mergeButton.disabled;
        const fileListHidden = this.app.fileListSection.style.display === 'none';
        
        this.log('Empty state UI',
            mergeButtonDisabled && fileListHidden,
            'Merge button should be disabled and file list hidden when no files'
        );

        // Test with files state
        this.app.addFiles([createTestPDF('ui-test.pdf')]);
        this.app.updateUI();
        
        const mergeButtonEnabled = !this.app.mergeButton.disabled;
        const fileListVisible = this.app.fileListSection.style.display === 'block';
        
        this.log('Files present UI',
            mergeButtonEnabled && fileListVisible,
            'Merge button should be enabled and file list visible with files'
        );

        this.app.clearAllFiles(); // Clean up
    }

    generateReport() {
        console.log('\n📊 Test Report');
        console.log('================');
        
        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = total - passed;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Pass Rate: ${passRate}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  • ${r.testName}: ${r.message}`));
        }

        console.log('\n🎉 Test Suite Complete!');
        
        // Store results globally for manual inspection
        window.testResults = this.testResults;
        
        return { total, passed, failed, passRate };
    }
}

// Utility functions for manual testing
window.testUtils = {
    createTestPDF,
    createNonPDFFile,
    createLargeFile,
    
    // Quick test functions
    async runQuickTest() {
        if (!window.app) {
            console.error('App not initialized');
            return;
        }
        
        const tester = new PDFMergerTests();
        return await tester.runAllTests();
    },
    
    // Manual test helpers
    addTestFiles() {
        const files = [
            createTestPDF('Manual-Test-1.pdf', 500),
            createTestPDF('Manual-Test-2.pdf', 300),
            createTestPDF('Manual-Test-3.pdf', 800)
        ];
        window.app.addFiles(files);
        console.log('✅ Added 3 test PDF files');
    },
    
    testInvalidFile() {
        const invalidFile = createNonPDFFile('invalid.txt');
        window.app.handleFileSelect([invalidFile]);
        console.log('🔍 Attempted to add invalid file (should show error)');
    },
    
    testLargeFile() {
        const largeFile = createLargeFile('too-big.pdf', 60000); // 60MB
        window.app.handleFileSelect([largeFile]);
        console.log('🔍 Attempted to add large file (should show error)');
    }
};

// Auto-run tests when in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🧪 Test utilities loaded. Use testUtils.runQuickTest() to run automated tests.');
    console.log('Manual test helpers: testUtils.addTestFiles(), testUtils.testInvalidFile(), testUtils.testLargeFile()');
}

// Export for use in console
window.PDFMergerTests = PDFMergerTests;
