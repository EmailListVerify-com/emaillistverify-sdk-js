/**
 * Contact Finder Example - EmailListVerify SDK
 *
 * This example demonstrates how to find contact email addresses
 * using the findContact API endpoint.
 */

import { EmailListVerifyClient } from 'emaillistverify-sdk-js';

const client = new EmailListVerifyClient(process.env.EMAILLISTVERIFY_API_KEY);

async function runContactFinderExamples() {
  try {
    // 1. Find contact by first name only
    console.log('\n1. Find Contact by First Name');
    console.log('================================');
    const result1 = await client.findContact({
      firstName: 'John',
      domain: 'example.com',
    });

    console.log('Found', result1.emails.length, 'contacts');
    result1.emails.forEach((contact, index) => {
      console.log(`\nContact ${index + 1}:`);
      console.log('  Email:', contact.email);
      console.log('  First name:', contact.firstName || 'N/A');
      console.log('  Last name:', contact.lastName || 'N/A');
      console.log('  Position:', contact.position || 'N/A');
    });

    // 2. Find contact by first and last name
    console.log('\n2. Find Contact by First and Last Name');
    console.log('================================');
    const result2 = await client.findContact({
      firstName: 'John',
      lastName: 'Doe',
      domain: 'company.com',
    });

    if (result2.emails.length > 0) {
      console.log('✅ Found contacts:');
      result2.emails.forEach(contact => {
        console.log(`  - ${contact.email} (${contact.firstName} ${contact.lastName})`);
        if (contact.position) {
          console.log(`    Position: ${contact.position}`);
        }
      });
    } else {
      console.log('No contacts found for this search');
    }

    // 3. Find multiple contacts at a domain
    console.log('\n3. Find Sales Contacts');
    console.log('================================');
    const result3 = await client.findContact({
      firstName: 'Sales',
      domain: 'business.org',
    });

    console.log(`Found ${result3.emails.length} sales contact(s)`);
    result3.emails.forEach(contact => {
      console.log(`  ${contact.email}`);
    });

    // 4. Find CEO/Leadership contacts
    console.log('\n4. Find Leadership Contacts');
    console.log('================================');
    const positions = ['CEO', 'CTO', 'CFO'];

    for (const position of positions) {
      try {
        const result = await client.findContact({
          firstName: position,
          domain: 'startup.io',
        });

        if (result.emails.length > 0) {
          console.log(`\n${position}:`);
          result.emails.forEach(contact => {
            console.log(`  - ${contact.email}`);
            if (contact.firstName && contact.lastName) {
              console.log(`    Name: ${contact.firstName} ${contact.lastName}`);
            }
          });
        }
      } catch (error) {
        console.log(`  No ${position} found`);
      }
    }

    console.log('\n✅ Contact finder examples completed!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'VALIDATION_ERROR') {
      console.error('Validation error: Please provide firstName/lastName and domain');
    } else if (error.code === 'INSUFFICIENT_CREDITS') {
      console.error('Not enough credits to perform contact search');
    }
  }
}

// Run the examples
runContactFinderExamples();
