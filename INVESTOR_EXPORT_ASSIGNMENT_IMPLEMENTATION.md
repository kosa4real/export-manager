# Investor Export Assignment Implementation

## Overview

This implementation adds the functionality for admins to assign specific exports to investors and for investors to track their assigned exports and profit calculations.

## Key Features Implemented

### 1. Export Assignment System

- **Admin Assignment**: Admins can assign specific exports to investors through a new assignment modal
- **Assignment API**: New API endpoints for assigning/unassigning exports to investors
- **Visual Indicators**: Export tables now show which investor is assigned to each export

### 2. Container Equivalent Calculation

- **Investment to Container Conversion**: Calculates how many container equivalents an investment represents
- **Example**: ₦100,000 investment ÷ ₦10,000 per container = 10 container equivalents
- **Visual Display**: Shows full containers and partial percentages

### 3. Investor Dashboard Enhancements

- **Assigned Exports View**: Investors see only exports assigned to their investment
- **Profit Calculations**: Shows investor's profit share based on their percentage
- **Performance Summary**: Displays total exports, bags, and profits earned
- **Business Overview**: Shows all recent export activities for context

### 4. Profit Sharing System

- **Percentage-based**: Uses profit share field (e.g., "50/50" means 50% to investor)
- **Automatic Calculation**: Calculates investor profit from export net profit
- **Real-time Display**: Shows profit amounts in investor dashboard

## Technical Implementation

### Database Schema

The existing schema already supports this functionality:

- `ExportShipment.assignedInvestorId` - Links exports to investors
- `Investor.containerEquivalent` - Stores container equivalent calculation
- `Investor.profitShare` - Defines profit sharing percentage

### New API Endpoints

#### `/api/exports/assign`

- **POST**: Assign export to investor
- **DELETE**: Remove investor assignment from export

#### `/api/investors/exports`

- Enhanced to return assigned exports with profit calculations
- Separates assigned exports from general business activity

#### `/api/investors/container-calculator`

- **POST**: Calculate container equivalent for investment amount
- **GET**: Get default container cost settings

### New Components

#### `InvestorAssignmentModal`

- Modal for admins to assign exports to investors
- Shows export details and investor selection
- Handles assignment/unassignment operations

#### `ContainerEquivalentDisplay`

- Visual representation of container equivalents
- Shows calculation breakdown
- Explains what the numbers mean

## User Experience

### For Admins

1. **Export Management**: View all exports with assignment status
2. **Assignment Control**: Click "Assign" button to assign exports to investors
3. **Visual Feedback**: See which exports are assigned to which investors
4. **Flexible Assignment**: Can reassign or unassign exports as needed

### For Investors

1. **Personal Dashboard**: See only exports assigned to their investment
2. **Profit Tracking**: View profit earned from each assigned export
3. **Container Understanding**: See how their investment translates to container equivalents
4. **Business Context**: View overall export activity while focusing on their assignments

## Example Scenario

### Investment Setup

- Investor invests ₦100,000
- Container cost is ₦10,000 each
- Container equivalent = 10 containers
- Profit share = 50/50

### Export Assignment

- Admin assigns Export #123 (1,000 bags to Saudi Arabia) to this investor
- Export generates ₦50,000 net profit
- Investor's share = ₦25,000 (50% of ₦50,000)

### Investor View

- Dashboard shows 1 assigned export
- Shows ₦25,000 profit earned
- Displays 10 container equivalents
- Shows export status and details

## Benefits

1. **Transparency**: Investors can see exactly which exports their money funded
2. **Accountability**: Clear tracking of profit distribution
3. **Flexibility**: Admins can assign exports based on various criteria
4. **Understanding**: Container equivalent helps investors understand their stake
5. **Trust**: Clear profit calculations build investor confidence

## Future Enhancements

1. **Automatic Assignment**: Rules-based assignment based on investment size
2. **Profit Notifications**: Email alerts when assigned exports generate profits
3. **Investment Analytics**: Detailed ROI and performance metrics
4. **Multi-investor Exports**: Split single exports between multiple investors
5. **Container Cost Management**: Admin interface to adjust container costs

## Usage Instructions

### For Admins

1. Go to Exports page
2. Click "Assign" button next to any export
3. Select investor from dropdown
4. Click "Assign Export" to confirm
5. View assignment status in export table

### For Investors

1. Login to investor account
2. View "My Assigned Exports" section
3. See profit calculations for completed exports
4. Check "Investment Performance" summary
5. Review "Recent Export Activities" for business context

This implementation provides a complete solution for investor-export assignment and profit tracking while maintaining the existing system's functionality.
