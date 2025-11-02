# Demo Scenario: Investor Export Assignment System

## Scenario Setup

Let's walk through a complete example of how the investor export assignment system works.

### Initial Setup

1. **Investor Profile**:

   - Name: John Doe
   - Investment: ₦100,000 (Naira)
   - Container Equivalent: 10 containers (₦10,000 per container)
   - Profit Share: 50/50

2. **Export Created**:
   - Export #001: 1,000 bags to Saudi Arabia
   - Export Date: Today
   - Status: PENDING
   - Initially unassigned

## Step-by-Step Process

### Step 1: Admin Assigns Export

1. Admin logs into the system
2. Goes to Exports page (`/dashboard/exports`)
3. Sees Export #001 with "Unassigned" status
4. Clicks "Assign" button next to Export #001
5. Modal opens showing:
   - Export details (1,000 bags to Saudi Arabia)
   - Dropdown with available investors
   - John Doe's investment details (₦100,000, 10 containers)
6. Admin selects John Doe and clicks "Assign Export"
7. System updates export with `assignedInvestorId = John's ID`

### Step 2: Export Processing

1. Export status changes from PENDING → IN_TRANSIT → DELIVERED
2. Admin updates financial details:
   - Amount Received: ₦200,000
   - Clearing Fee: ₦50,000
   - Net Profit: ₦150,000

### Step 3: Investor Views Assignment

1. John logs into his investor account
2. Dashboard shows:
   - **My Assigned Exports**: 1 export
   - **Export #001**: 1,000 bags, DELIVERED status
   - **My Profit**: ₦75,000 (50% of ₦150,000 net profit)
   - **Container Equivalent**: 10 containers used

### Step 4: Performance Summary

John's dashboard displays:

- **Total Exports Assigned**: 1
- **Total Bags Exported**: 1,000
- **Total Profit Earned**: ₦75,000
- **ROI**: 75% return on ₦100,000 investment

## Multiple Export Scenario

### Additional Exports

Admin assigns 2 more exports to John:

1. **Export #002**: 800 bags to UAE

   - Net Profit: ₦120,000
   - John's Share: ₦60,000

2. **Export #003**: 1,200 bags to Qatar
   - Net Profit: ₦180,000
   - John's Share: ₦90,000

### Updated Performance

John's dashboard now shows:

- **Total Exports Assigned**: 3
- **Total Bags Exported**: 3,000 bags
- **Total Profit Earned**: ₦225,000 (₦75k + ₦60k + ₦90k)
- **ROI**: 225% return on ₦100,000 investment

## Container Equivalent Explanation

### Investment Breakdown

- **Investment**: ₦100,000
- **Container Cost**: ₦10,000 each
- **Calculation**: ₦100,000 ÷ ₦10,000 = 10 containers
- **Meaning**: John's investment can fund 10 full containers worth of exports

### Visual Display

```
Container Equivalent: 10.00
├── Full Containers: 10
└── Partial: 0%

Calculation:
₦100,000 ÷ ₦10,000 = 10.00 containers

What this means:
Your investment of ₦100,000 is equivalent to 10 full containers.
This determines your share in export profits.
```

## System Benefits Demonstrated

### For Investors (John's Perspective)

1. **Transparency**: Can see exactly which exports his money funded
2. **Profit Tracking**: Clear view of earnings from each export
3. **Understanding**: Container equivalent helps understand investment scale
4. **Performance**: Easy to track ROI and total returns

### For Admins

1. **Control**: Can assign exports strategically based on investor preferences
2. **Tracking**: Clear view of which exports are assigned to which investors
3. **Flexibility**: Can reassign exports if needed
4. **Reporting**: Easy to generate investor-specific reports

### For Business

1. **Investor Relations**: Builds trust through transparency
2. **Accountability**: Clear profit distribution tracking
3. **Growth**: Helps attract more investors with clear profit sharing
4. **Efficiency**: Streamlined assignment and tracking process

## Real-World Usage

### Daily Operations

1. **Morning**: Admin reviews new exports and assigns them to investors
2. **Processing**: Exports move through status updates (PENDING → IN_TRANSIT → DELIVERED)
3. **Completion**: Admin updates financial details when exports complete
4. **Reporting**: Investors can check their dashboard anytime for updates

### Monthly Review

1. **Investor Reports**: Each investor sees their monthly performance
2. **Profit Distribution**: Clear breakdown of earnings by export
3. **ROI Analysis**: Track return on investment over time
4. **Business Growth**: Use data to attract new investors

This system provides complete transparency and control over investor-export relationships while maintaining operational efficiency.
