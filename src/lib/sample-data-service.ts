import { supabase } from './supabase'
import { SidebarService } from './sidebar-service'
import { PageContentService } from './page-content-service'

export class SampleDataService {
  // Create comprehensive sample data for a new organization
  static async createSampleData(organizationId: string, organizationName: string) {
    console.log('🎭 Creating sample data for organization:', organizationName)
    
    try {
      // Create sample sidebar items with content
      await this.createSampleSidebarItems(organizationId, organizationName)
      
      // Create sample organizational data
      await this.createSampleOrganizationalData(organizationId, organizationName)
      
      console.log('✅ Sample data creation completed for:', organizationName)
      
    } catch (error) {
      console.error('❌ Error creating sample data:', error)
      // Don't throw error - sample data creation shouldn't block organization creation
    }
  }

  // Create sample sidebar items with different content types
  static async createSampleSidebarItems(organizationId: string, organizationName: string) {
    console.log('📋 Creating sample sidebar items...')

    const sampleItems = [
      {
        name: 'Welcome Guide',
        slug: 'welcome-guide',
        category: 'CORE DOCUMENTATION',
        icon: 'FileText',
        description: 'Getting started guide for new team members',
        contentType: 'rich-text',
        content: {
          title: `Welcome to ${organizationName}`,
          content: `<h1>Welcome to ${organizationName}!</h1>

<p>This is your organization's IT documentation portal. Here you'll find all the essential information, procedures, and resources you need.</p>

<h2>🚀 Getting Started</h2>
<ul>
<li><strong>Explore the sidebar</strong> - Navigate through different sections using the menu on the left</li>
<li><strong>Search functionality</strong> - Use the search bar to quickly find specific information</li>
<li><strong>Custom forms</strong> - Submit requests and reports using our interactive forms</li>
<li><strong>Contact information</strong> - Find key contacts and their details</li>
</ul>

<h2>📚 What You'll Find Here</h2>
<ul>
<li>IT policies and procedures</li>
<li>Contact information for key personnel</li>
<li>Location and facility details</li>
<li>Request forms and workflows</li>
<li>Documentation and resources</li>
</ul>

<h2>🔧 Need Help?</h2>
<p>If you need assistance or have questions, please reach out to our IT support team using the contact forms or direct contact information provided in this portal.</p>

<p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>`
        }
      },
      {
        name: 'IT Support Request',
        slug: 'it-support-request',
        category: 'CLIENT CONTACT',
        icon: 'FileInput',
        description: 'Submit IT support tickets and requests',
        contentType: 'form-data',
        content: {
          formTitle: 'IT Support Request Form',
          elements: [
            {
              id: 'element_name_001',
              type: 'text',
              label: 'Your Full Name',
              placeholder: 'Enter your full name',
              required: true
            },
            {
              id: 'element_email_002',
              type: 'text',
              label: 'Email Address',
              placeholder: 'your.email@company.com',
              required: true
            },
            {
              id: 'element_department_003',
              type: 'select',
              label: 'Department',
              required: true,
              options: ['Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'IT', 'Other']
            },
            {
              id: 'element_priority_004',
              type: 'radio',
              label: 'Priority Level',
              required: true,
              options: ['Low - Can wait a few days', 'Medium - Needed within 24 hours', 'High - Urgent, blocking work']
            },
            {
              id: 'element_category_005',
              type: 'select',
              label: 'Issue Category',
              required: true,
              options: ['Hardware Problem', 'Software Issue', 'Network/Internet', 'Email Problem', 'Password Reset', 'New User Setup', 'Equipment Request', 'Other']
            },
            {
              id: 'element_description_006',
              type: 'textarea',
              label: 'Detailed Description',
              placeholder: 'Please describe the issue in detail, including any error messages and steps you\'ve already tried...',
              required: true
            },
            {
              id: 'element_attachment_007',
              type: 'file',
              label: 'Attachments (Screenshots, Error Logs)',
              required: false
            }
          ],
          submissions: []
        }
      },
      {
        name: 'Employee Onboarding',
        slug: 'employee-onboarding',
        category: 'CLIENT CONTACT',
        icon: 'FileInput',
        description: 'New employee setup and onboarding form',
        contentType: 'form-data',
        content: {
          formTitle: 'New Employee Onboarding Form',
          elements: [
            {
              id: 'element_emp_name_001',
              type: 'text',
              label: 'Employee Full Name',
              placeholder: 'First Last',
              required: true
            },
            {
              id: 'element_start_date_002',
              type: 'date',
              label: 'Start Date',
              required: true
            },
            {
              id: 'element_position_003',
              type: 'text',
              label: 'Job Title/Position',
              placeholder: 'e.g., Software Developer, Sales Manager',
              required: true
            },
            {
              id: 'element_manager_004',
              type: 'text',
              label: 'Direct Manager',
              placeholder: 'Manager\'s full name',
              required: true
            },
            {
              id: 'element_equipment_005',
              type: 'checkbox',
              label: 'Equipment Needed',
              required: false,
              options: ['Laptop/Desktop Computer', 'Monitor', 'Keyboard & Mouse', 'Phone/Headset', 'Mobile Device', 'Printer Access', 'Security Badge']
            },
            {
              id: 'element_software_006',
              type: 'checkbox',
              label: 'Software Access Required',
              required: false,
              options: ['Microsoft Office 365', 'CRM System', 'Project Management Tools', 'Design Software', 'Development Tools', 'VPN Access']
            },
            {
              id: 'element_location_007',
              type: 'location',
              label: 'Primary Work Location',
              required: true
            }
          ],
          submissions: []
        }
      },
      {
        name: 'Equipment Request',
        slug: 'equipment-request',
        category: 'CLIENT CONTACT',
        icon: 'FileInput',
        description: 'Request new equipment or hardware',
        contentType: 'form-data',
        content: {
          formTitle: 'Equipment Request Form',
          elements: [
            {
              id: 'element_requester_001',
              type: 'text',
              label: 'Requester Name',
              placeholder: 'Your full name',
              required: true
            },
            {
              id: 'element_req_date_002',
              type: 'date',
              label: 'Date Needed',
              required: true
            },
            {
              id: 'element_equipment_type_003',
              type: 'select',
              label: 'Equipment Type',
              required: true,
              options: ['Laptop', 'Desktop Computer', 'Monitor', 'Printer', 'Phone', 'Tablet', 'Accessories', 'Other']
            },
            {
              id: 'element_justification_004',
              type: 'textarea',
              label: 'Business Justification',
              placeholder: 'Please explain why this equipment is needed and how it will be used...',
              required: true
            },
            {
              id: 'element_budget_005',
              type: 'number',
              label: 'Estimated Budget (CAD)',
              placeholder: '0.00',
              required: false
            },
            {
              id: 'element_urgent_006',
              type: 'checkbox',
              label: 'Special Requirements',
              required: false,
              options: ['Urgent Request', 'Specific Brand Required', 'Mobility Required', 'High Performance Needed']
            }
          ],
          submissions: []
        }
      },
      {
        name: 'IT Policies',
        slug: 'it-policies',
        category: 'CORE DOCUMENTATION',
        icon: 'FileText',
        description: 'Company IT policies and guidelines',
        contentType: 'rich-text',
        content: {
          title: 'IT Policies & Guidelines',
          content: `<h1>IT Policies & Guidelines</h1>

<h2>🔐 Security Policies</h2>

<h3>Password Requirements</h3>
<ul>
<li>Minimum 12 characters in length</li>
<li>Must include uppercase, lowercase, numbers, and special characters</li>
<li>Cannot reuse last 12 passwords</li>
<li>Must be changed every 90 days</li>
<li>Use of password managers is strongly encouraged</li>
</ul>

<h3>Data Protection</h3>
<ul>
<li>All sensitive data must be encrypted at rest and in transit</li>
<li>USB drives and external storage require approval</li>
<li>Personal devices must comply with BYOD policy</li>
<li>Regular security awareness training is mandatory</li>
</ul>

<h2>💻 Equipment Usage</h2>

<h3>Company Equipment</h3>
<ul>
<li>Company devices are for business use primarily</li>
<li>Limited personal use is permitted during breaks</li>
<li>All software installations require IT approval</li>
<li>Regular backups are automatically performed</li>
</ul>

<h3>Remote Work</h3>
<ul>
<li>VPN connection required for all remote access</li>
<li>Secure Wi-Fi networks only</li>
<li>Physical security of devices is user responsibility</li>
<li>Regular check-ins with IT support recommended</li>
</ul>

<h2>📧 Email & Communication</h2>
<ul>
<li>Professional communication standards apply</li>
<li>Suspicious emails should be reported immediately</li>
<li>Large attachments should use file sharing services</li>
<li>Auto-forwarding to external accounts is prohibited</li>
</ul>

<p><strong>Questions?</strong> Contact IT Support for clarification on any policy.</p>

<p><em>Policy last updated: ${new Date().toLocaleDateString()}</em></p>`
        }
      }
    ]

    for (const item of sampleItems) {
      try {
        // Create sidebar item
        const sidebarItem = await SidebarService.createSidebarItem({
          organization_id: organizationId,
          parent_category: item.category,
          item_name: item.name,
          item_slug: item.slug,

          icon: item.icon,
          description: item.description,
          sort_order: 100,
          is_active: true,
          is_system: false
        })

        // Create page content
        await PageContentService.createDefaultPageContent(sidebarItem.id, item.contentType)
        
        // Update with sample content
        const pageContent = await PageContentService.getPageContent(sidebarItem.id)
        await PageContentService.updatePageContent(pageContent.id, {
          content_data: item.content
        })

        console.log(`✅ Created sample sidebar item: ${item.name}`)

      } catch (error) {
        console.error(`❌ Error creating sidebar item ${item.name}:`, error)
      }
    }
  }

  // Create sample organizational data (contacts, locations, etc.)
  static async createSampleOrganizationalData(organizationId: string, organizationName: string) {
    console.log('🏢 Creating sample organizational data...')

    // This would create sample data in other tables
    // For now, we'll focus on the sidebar items and content
    // Future enhancement: Add sample contacts, locations, documents, etc.
    
    console.log('📊 Sample organizational data creation completed')
  }
}
