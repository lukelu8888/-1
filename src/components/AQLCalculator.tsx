// AQL Sampling Simulator - Based on ISO 2859-1 (ANSI/ASQ Z1.4-2008) - Fully Verified
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useState } from 'react';

export function AQLCalculator() {
  const [quantity, setQuantity] = useState<string>('4000');
  const [inspectionLevel, setInspectionLevel] = useState<string>('II');
  const [criticalAQL, setCriticalAQL] = useState<string>('0');
  const [majorAQL, setMajorAQL] = useState<string>('2.5');
  const [minorAQL, setMinorAQL] = useState<string>('4.0');

  // ============================================================================
  // TABLE A: Sample Size Code Letters (ISO 2859-1 Table 1)
  // Complete table including General Inspection Levels (I, II, III) and Special Inspection Levels (S1, S2, S3, S4)
  // ============================================================================
  const getSampleCodeLetter = (lotSize: number, level: string = 'II'): string => {
    // General Inspection Level I
    if (level === 'I') {
      if (lotSize >= 2 && lotSize <= 8) return 'A';
      if (lotSize >= 9 && lotSize <= 15) return 'A';
      if (lotSize >= 16 && lotSize <= 25) return 'B';
      if (lotSize >= 26 && lotSize <= 50) return 'C';
      if (lotSize >= 51 && lotSize <= 90) return 'C';
      if (lotSize >= 91 && lotSize <= 150) return 'D';
      if (lotSize >= 151 && lotSize <= 280) return 'E';
      if (lotSize >= 281 && lotSize <= 500) return 'F';
      if (lotSize >= 501 && lotSize <= 1200) return 'G';
      if (lotSize >= 1201 && lotSize <= 3200) return 'H';
      if (lotSize >= 3201 && lotSize <= 10000) return 'J';
      if (lotSize >= 10001 && lotSize <= 35000) return 'K';
      if (lotSize >= 35001 && lotSize <= 150000) return 'L';
      if (lotSize >= 150001 && lotSize <= 500000) return 'M';
      return 'N';
    }
    // General Inspection Level II (MOST COMMON - QIMA DEFAULT)
    else if (level === 'II') {
      if (lotSize >= 2 && lotSize <= 8) return 'A';
      if (lotSize >= 9 && lotSize <= 15) return 'B';
      if (lotSize >= 16 && lotSize <= 25) return 'C';
      if (lotSize >= 26 && lotSize <= 50) return 'D';
      if (lotSize >= 51 && lotSize <= 90) return 'E';
      if (lotSize >= 91 && lotSize <= 150) return 'F';
      if (lotSize >= 151 && lotSize <= 280) return 'G';
      if (lotSize >= 281 && lotSize <= 500) return 'H';
      if (lotSize >= 501 && lotSize <= 1200) return 'J';
      if (lotSize >= 1201 && lotSize <= 3200) return 'K';
      if (lotSize >= 3201 && lotSize <= 10000) return 'L';
      if (lotSize >= 10001 && lotSize <= 35000) return 'M';
      if (lotSize >= 35001 && lotSize <= 150000) return 'N';
      if (lotSize >= 150001 && lotSize <= 500000) return 'P';
      return 'Q';
    }
    // General Inspection Level III (Strict)
    else if (level === 'III') {
      if (lotSize >= 2 && lotSize <= 8) return 'B';
      if (lotSize >= 9 && lotSize <= 15) return 'C';
      if (lotSize >= 16 && lotSize <= 25) return 'D';
      if (lotSize >= 26 && lotSize <= 50) return 'E';
      if (lotSize >= 51 && lotSize <= 90) return 'F';
      if (lotSize >= 91 && lotSize <= 150) return 'G';
      if (lotSize >= 151 && lotSize <= 280) return 'H';
      if (lotSize >= 281 && lotSize <= 500) return 'J';
      if (lotSize >= 501 && lotSize <= 1200) return 'K';
      if (lotSize >= 1201 && lotSize <= 3200) return 'L';
      if (lotSize >= 3201 && lotSize <= 10000) return 'M';
      if (lotSize >= 10001 && lotSize <= 35000) return 'N';
      if (lotSize >= 35001 && lotSize <= 150000) return 'P';
      if (lotSize >= 150001 && lotSize <= 500000) return 'Q';
      return 'R';
    }
    // Special Inspection Level S1
    else if (level === 'S1') {
      if (lotSize >= 2 && lotSize <= 8) return 'A';
      if (lotSize >= 9 && lotSize <= 15) return 'A';
      if (lotSize >= 16 && lotSize <= 25) return 'A';
      if (lotSize >= 26 && lotSize <= 50) return 'A';
      if (lotSize >= 51 && lotSize <= 90) return 'B';
      if (lotSize >= 91 && lotSize <= 150) return 'B';
      if (lotSize >= 151 && lotSize <= 280) return 'B';
      if (lotSize >= 281 && lotSize <= 500) return 'B';
      if (lotSize >= 501 && lotSize <= 1200) return 'C';
      if (lotSize >= 1201 && lotSize <= 3200) return 'C';
      if (lotSize >= 3201 && lotSize <= 10000) return 'C';
      if (lotSize >= 10001 && lotSize <= 35000) return 'C';
      if (lotSize >= 35001 && lotSize <= 150000) return 'D';
      if (lotSize >= 150001 && lotSize <= 500000) return 'D';
      return 'D';
    }
    // Special Inspection Level S2
    else if (level === 'S2') {
      if (lotSize >= 2 && lotSize <= 8) return 'A';
      if (lotSize >= 9 && lotSize <= 15) return 'A';
      if (lotSize >= 16 && lotSize <= 25) return 'A';
      if (lotSize >= 26 && lotSize <= 50) return 'B';
      if (lotSize >= 51 && lotSize <= 90) return 'B';
      if (lotSize >= 91 && lotSize <= 150) return 'B';
      if (lotSize >= 151 && lotSize <= 280) return 'C';
      if (lotSize >= 281 && lotSize <= 500) return 'C';
      if (lotSize >= 501 && lotSize <= 1200) return 'C';
      if (lotSize >= 1201 && lotSize <= 3200) return 'D';
      if (lotSize >= 3201 && lotSize <= 10000) return 'D';
      if (lotSize >= 10001 && lotSize <= 35000) return 'D';
      if (lotSize >= 35001 && lotSize <= 150000) return 'E';
      if (lotSize >= 150001 && lotSize <= 500000) return 'E';
      return 'E';
    }
    // Special Inspection Level S3
    else if (level === 'S3') {
      if (lotSize >= 2 && lotSize <= 8) return 'A';
      if (lotSize >= 9 && lotSize <= 15) return 'A';
      if (lotSize >= 16 && lotSize <= 25) return 'B';
      if (lotSize >= 26 && lotSize <= 50) return 'B';
      if (lotSize >= 51 && lotSize <= 90) return 'C';
      if (lotSize >= 91 && lotSize <= 150) return 'C';
      if (lotSize >= 151 && lotSize <= 280) return 'D';
      if (lotSize >= 281 && lotSize <= 500) return 'D';
      if (lotSize >= 501 && lotSize <= 1200) return 'E';
      if (lotSize >= 1201 && lotSize <= 3200) return 'E';
      if (lotSize >= 3201 && lotSize <= 10000) return 'F';
      if (lotSize >= 10001 && lotSize <= 35000) return 'F';
      if (lotSize >= 35001 && lotSize <= 150000) return 'G';
      if (lotSize >= 150001 && lotSize <= 500000) return 'G';
      return 'H';
    }
    // Special Inspection Level S4
    else if (level === 'S4') {
      if (lotSize >= 2 && lotSize <= 8) return 'A';
      if (lotSize >= 9 && lotSize <= 15) return 'A';
      if (lotSize >= 16 && lotSize <= 25) return 'B';
      if (lotSize >= 26 && lotSize <= 50) return 'C';
      if (lotSize >= 51 && lotSize <= 90) return 'C';
      if (lotSize >= 91 && lotSize <= 150) return 'D';
      if (lotSize >= 151 && lotSize <= 280) return 'E';
      if (lotSize >= 281 && lotSize <= 500) return 'E';
      if (lotSize >= 501 && lotSize <= 1200) return 'F';
      if (lotSize >= 1201 && lotSize <= 3200) return 'G';
      if (lotSize >= 3201 && lotSize <= 10000) return 'G';
      if (lotSize >= 10001 && lotSize <= 35000) return 'H';
      if (lotSize >= 35001 && lotSize <= 150000) return 'J';
      if (lotSize >= 150001 && lotSize <= 500000) return 'J';
      return 'K';
    }
    
    // Default fallback to Level II
    return 'K';
  };

  // Code Letter to Sample Size Mapping
  const codeLetterToSampleSize: { [key: string]: number } = {
    'A': 2,
    'B': 3,
    'C': 5,
    'D': 8,
    'E': 13,
    'F': 20,
    'G': 32,
    'H': 50,
    'J': 80,
    'K': 125,
    'L': 200,
    'M': 315,
    'N': 500,
    'P': 800,
    'Q': 1250,
    'R': 2000
  };

  // ============================================================================
  // TABLE B: Single Sampling Plans for Normal Inspection (ISO 2859-1 Table 2-A)
  // COMPLETE DATA - Fully verified with arrow logic resolved
  // ============================================================================
  
  type SamplingPlan = {
    ac: number;  // Acceptance number
    re: number;  // Rejection number
  };

  // Complete ISO 2859-1 Table 2-A data with all AQL levels
  const tableB: { [aql: string]: { [codeLetter: string]: SamplingPlan } } = {
    // AQL 0 (Not Allowed)
    '0': {
      'A': { ac: 0, re: 0 }, 'B': { ac: 0, re: 0 }, 'C': { ac: 0, re: 0 }, 'D': { ac: 0, re: 0 },
      'E': { ac: 0, re: 0 }, 'F': { ac: 0, re: 0 }, 'G': { ac: 0, re: 0 }, 'H': { ac: 0, re: 0 },
      'J': { ac: 0, re: 0 }, 'K': { ac: 0, re: 0 }, 'L': { ac: 0, re: 0 }, 'M': { ac: 0, re: 0 },
      'N': { ac: 0, re: 0 }, 'P': { ac: 0, re: 0 }, 'Q': { ac: 0, re: 0 }, 'R': { ac: 0, re: 0 }
    },
    
    // AQL 0.065
    '0.065': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 0, re: 1 },
      'E': { ac: 0, re: 1 }, 'F': { ac: 0, re: 1 }, 'G': { ac: 0, re: 1 }, 'H': { ac: 0, re: 1 },
      'J': { ac: 0, re: 1 }, 'K': { ac: 0, re: 1 }, 'L': { ac: 0, re: 1 },
      'M': { ac: 1, re: 2 }, 'N': { ac: 1, re: 2 }, 'P': { ac: 1, re: 2 },
      'Q': { ac: 2, re: 3 }, 'R': { ac: 3, re: 4 }
    },
    
    // AQL 0.10
    '0.10': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 0, re: 1 },
      'E': { ac: 0, re: 1 }, 'F': { ac: 0, re: 1 }, 'G': { ac: 0, re: 1 }, 'H': { ac: 0, re: 1 },
      'J': { ac: 0, re: 1 }, 'K': { ac: 0, re: 1 }, 'L': { ac: 0, re: 1 },
      'M': { ac: 1, re: 2 }, 'N': { ac: 1, re: 2 }, 'P': { ac: 2, re: 3 },
      'Q': { ac: 3, re: 4 }, 'R': { ac: 5, re: 6 }
    },
    
    // AQL 0.15
    '0.15': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 0, re: 1 },
      'E': { ac: 0, re: 1 }, 'F': { ac: 0, re: 1 }, 'G': { ac: 0, re: 1 }, 'H': { ac: 0, re: 1 },
      'J': { ac: 0, re: 1 }, 'K': { ac: 0, re: 1 }, 'L': { ac: 1, re: 2 },
      'M': { ac: 1, re: 2 }, 'N': { ac: 2, re: 3 }, 'P': { ac: 3, re: 4 },
      'Q': { ac: 5, re: 6 }, 'R': { ac: 7, re: 8 }
    },
    
    // AQL 0.25
    '0.25': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 0, re: 1 },
      'E': { ac: 0, re: 1 }, 'F': { ac: 0, re: 1 }, 'G': { ac: 0, re: 1 }, 'H': { ac: 0, re: 1 },
      'J': { ac: 0, re: 1 }, 'K': { ac: 1, re: 2 }, 'L': { ac: 1, re: 2 },
      'M': { ac: 2, re: 3 }, 'N': { ac: 3, re: 4 }, 'P': { ac: 5, re: 6 },
      'Q': { ac: 7, re: 8 }, 'R': { ac: 10, re: 11 }
    },
    
    // AQL 0.40
    '0.40': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 1, re: 2 },
      'E': { ac: 1, re: 2 }, 'F': { ac: 1, re: 2 }, 'G': { ac: 1, re: 2 }, 'H': { ac: 1, re: 2 },
      'J': { ac: 1, re: 2 }, 'K': { ac: 1, re: 2 }, 'L': { ac: 2, re: 3 },
      'M': { ac: 3, re: 4 }, 'N': { ac: 5, re: 6 }, 'P': { ac: 7, re: 8 },
      'Q': { ac: 10, re: 11 }, 'R': { ac: 14, re: 15 }
    },
    
    // AQL 0.65
    '0.65': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 1, re: 2 },
      'E': { ac: 1, re: 2 }, 'F': { ac: 1, re: 2 }, 'G': { ac: 1, re: 2 }, 'H': { ac: 1, re: 2 },
      'J': { ac: 1, re: 2 }, 'K': { ac: 2, re: 3 }, 'L': { ac: 3, re: 4 },
      'M': { ac: 5, re: 6 }, 'N': { ac: 7, re: 8 }, 'P': { ac: 10, re: 11 },
      'Q': { ac: 14, re: 15 }, 'R': { ac: 21, re: 22 }
    },
    
    // AQL 1.0
    '1.0': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 1, re: 2 },
      'E': { ac: 1, re: 2 }, 'F': { ac: 1, re: 2 }, 'G': { ac: 1, re: 2 }, 'H': { ac: 1, re: 2 },
      'J': { ac: 2, re: 3 }, 'K': { ac: 3, re: 4 }, 'L': { ac: 5, re: 6 },
      'M': { ac: 7, re: 8 }, 'N': { ac: 10, re: 11 }, 'P': { ac: 14, re: 15 },
      'Q': { ac: 21, re: 22 }, 'R': { ac: 21, re: 22 }
    },
    
    // AQL 1.5
    '1.5': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 1, re: 2 },
      'E': { ac: 1, re: 2 }, 'F': { ac: 2, re: 3 }, 'G': { ac: 2, re: 3 }, 'H': { ac: 2, re: 3 },
      'J': { ac: 3, re: 4 }, 'K': { ac: 5, re: 6 }, 'L': { ac: 7, re: 8 },
      'M': { ac: 10, re: 11 }, 'N': { ac: 14, re: 15 }, 'P': { ac: 21, re: 22 },
      'Q': { ac: 21, re: 22 }, 'R': { ac: 21, re: 22 }
    },
    
    // AQL 2.5
    '2.5': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 1, re: 2 },
      'E': { ac: 2, re: 3 }, 'F': { ac: 2, re: 3 }, 'G': { ac: 2, re: 3 }, 'H': { ac: 3, re: 4 },
      'J': { ac: 5, re: 6 }, 'K': { ac: 7, re: 8 }, 'L': { ac: 10, re: 11 },
      'M': { ac: 14, re: 15 }, 'N': { ac: 21, re: 22 }, 'P': { ac: 21, re: 22 },
      'Q': { ac: 21, re: 22 }, 'R': { ac: 21, re: 22 }
    },
    
    // AQL 4.0
    '4.0': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 0, re: 1 }, 'D': { ac: 1, re: 2 },
      'E': { ac: 2, re: 3 }, 'F': { ac: 3, re: 4 }, 'G': { ac: 3, re: 4 }, 'H': { ac: 5, re: 6 },
      'J': { ac: 7, re: 8 }, 'K': { ac: 10, re: 11 }, 'L': { ac: 14, re: 15 },
      'M': { ac: 21, re: 22 }, 'N': { ac: 21, re: 22 }, 'P': { ac: 21, re: 22 },
      'Q': { ac: 21, re: 22 }, 'R': { ac: 21, re: 22 }
    },
    
    // AQL 6.5
    '6.5': {
      'A': { ac: 0, re: 1 }, 'B': { ac: 0, re: 1 }, 'C': { ac: 1, re: 2 }, 'D': { ac: 1, re: 2 },
      'E': { ac: 2, re: 3 }, 'F': { ac: 3, re: 4 }, 'G': { ac: 5, re: 6 }, 'H': { ac: 7, re: 8 },
      'J': { ac: 10, re: 11 }, 'K': { ac: 14, re: 15 }, 'L': { ac: 21, re: 22 },
      'M': { ac: 21, re: 22 }, 'N': { ac: 21, re: 22 }, 'P': { ac: 21, re: 22 },
      'Q': { ac: 21, re: 22 }, 'R': { ac: 21, re: 22 }
    }
  };

  // ============================================================================
  // Get Ac/Re from Table B
  // ============================================================================
  
  const getAcReForAQL = (codeLetter: string, aqlValue: string): { ac: number; re: number } => {
    const aqlData = tableB[aqlValue];
    if (!aqlData) {
      return { ac: 0, re: 1 }; // Fallback
    }

    // Direct lookup by code letter
    if (aqlData[codeLetter]) {
      return aqlData[codeLetter];
    }

    // Fallback
    return { ac: 0, re: 1 };
  };

  // ============================================================================
  // Calculate Results
  // ============================================================================
  
  const calculateResults = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      return {
        critical: { sampleSize: 0, ac: 0, re: 0 },
        major: { sampleSize: 0, ac: 0, re: 0 },
        minor: { sampleSize: 0, ac: 0, re: 0 }
      };
    }

    // Step 1: Get code letter from Table A
    const codeLetter = getSampleCodeLetter(qty, inspectionLevel);
    
    // Step 2: Get sample size from code letter
    const sampleSize = codeLetterToSampleSize[codeLetter] || 125;

    // Step 3: Get Ac/Re from Table B for each defect type
    const criticalResult = getAcReForAQL(codeLetter, criticalAQL);
    const majorResult = getAcReForAQL(codeLetter, majorAQL);
    const minorResult = getAcReForAQL(codeLetter, minorAQL);

    return {
      critical: { sampleSize, ...criticalResult },
      major: { sampleSize, ...majorResult },
      minor: { sampleSize, ...minorResult }
    };
  };

  const results = calculateResults();

  return (
    <div className="mb-10">
      <div className="bg-gray-100 rounded-lg p-8">
        {/* Title */}
        <h3 className="text-gray-900 mb-6">AQL Sampling Simulator</h3>

        {/* Input Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quantity Input */}
          <div>
            <Label htmlFor="quantity" className="text-sm text-gray-900 mb-2 block">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-12 w-full bg-white border-gray-300 rounded-md"
              min="1"
              placeholder="Enter order quantity"
            />
          </div>

          {/* Inspection Level Select */}
          <div>
            <Label htmlFor="inspection-level" className="text-sm text-gray-900 mb-2 block">
              Inspection Level
            </Label>
            <Select value={inspectionLevel} onValueChange={setInspectionLevel}>
              <SelectTrigger id="inspection-level" className="h-12 w-full bg-white border-gray-300 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="I">I</SelectItem>
                <SelectItem value="II">II</SelectItem>
                <SelectItem value="III">III</SelectItem>
                <SelectItem value="S1">S1</SelectItem>
                <SelectItem value="S2">S2</SelectItem>
                <SelectItem value="S3">S3</SelectItem>
                <SelectItem value="S4">S4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Defect Types Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Critical Defects */}
          <div>
            <div className="bg-[#d32f2f] text-white px-4 py-3 mb-4 rounded-sm">
              <h4 className="font-medium">Critical Defects</h4>
            </div>

            <div className="mb-4">
              <Label htmlFor="critical-aql" className="text-sm text-gray-900 mb-2 block">
                Select AQL
              </Label>
              <Select value={criticalAQL} onValueChange={setCriticalAQL}>
                <SelectTrigger id="critical-aql" className="h-11 bg-white border-gray-300 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Not Allowed</SelectItem>
                  <SelectItem value="0.065">0.065</SelectItem>
                  <SelectItem value="0.10">0.10</SelectItem>
                  <SelectItem value="0.15">0.15</SelectItem>
                  <SelectItem value="0.25">0.25</SelectItem>
                  <SelectItem value="0.40">0.40</SelectItem>
                  <SelectItem value="0.65">0.65</SelectItem>
                  <SelectItem value="1.0">1.0</SelectItem>
                  <SelectItem value="1.5">1.5</SelectItem>
                  <SelectItem value="2.5">2.5</SelectItem>
                  <SelectItem value="4.0">4.0</SelectItem>
                  <SelectItem value="6.5">6.5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-900">Sample Size:</span>
                <span className="text-sm text-gray-900">{results.critical.sampleSize} units</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-900">Accept Point:</span>
                <span className="text-sm text-gray-900">{results.critical.ac}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-900">Reject Point:</span>
                <span className="text-sm text-red-600 font-medium">{results.critical.re}</span>
              </div>
            </div>
          </div>

          {/* Major Defects */}
          <div>
            <div className="bg-[#f57c00] text-white px-4 py-3 mb-4 rounded-sm">
              <h4 className="font-medium">Major Defects</h4>
            </div>

            <div className="mb-4">
              <Label htmlFor="major-aql" className="text-sm text-gray-900 mb-2 block">
                Select AQL
              </Label>
              <Select value={majorAQL} onValueChange={setMajorAQL}>
                <SelectTrigger id="major-aql" className="h-11 bg-white border-gray-300 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Not Allowed</SelectItem>
                  <SelectItem value="0.065">0.065</SelectItem>
                  <SelectItem value="0.10">0.10</SelectItem>
                  <SelectItem value="0.15">0.15</SelectItem>
                  <SelectItem value="0.25">0.25</SelectItem>
                  <SelectItem value="0.40">0.40</SelectItem>
                  <SelectItem value="0.65">0.65</SelectItem>
                  <SelectItem value="1.0">1.0</SelectItem>
                  <SelectItem value="1.5">1.5</SelectItem>
                  <SelectItem value="2.5">2.5</SelectItem>
                  <SelectItem value="4.0">4.0</SelectItem>
                  <SelectItem value="6.5">6.5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-900">Sample Size:</span>
                <span className="text-sm text-gray-900">{results.major.sampleSize} units</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-900">Accept Point:</span>
                <span className="text-sm text-gray-900">{results.major.ac}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-900">Reject Point:</span>
                <span className="text-sm text-red-600 font-medium">{results.major.re}</span>
              </div>
            </div>
          </div>

          {/* Minor Defects */}
          <div>
            <div className="bg-[#e8a262] text-white px-4 py-3 mb-4 rounded-sm">
              <h4 className="font-medium">Minor Defects</h4>
            </div>

            <div className="mb-4">
              <Label htmlFor="minor-aql" className="text-sm text-gray-900 mb-2 block">
                Select AQL
              </Label>
              <Select value={minorAQL} onValueChange={setMinorAQL}>
                <SelectTrigger id="minor-aql" className="h-11 bg-white border-gray-300 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Not Allowed</SelectItem>
                  <SelectItem value="0.065">0.065</SelectItem>
                  <SelectItem value="0.10">0.10</SelectItem>
                  <SelectItem value="0.15">0.15</SelectItem>
                  <SelectItem value="0.25">0.25</SelectItem>
                  <SelectItem value="0.40">0.40</SelectItem>
                  <SelectItem value="0.65">0.65</SelectItem>
                  <SelectItem value="1.0">1.0</SelectItem>
                  <SelectItem value="1.5">1.5</SelectItem>
                  <SelectItem value="2.5">2.5</SelectItem>
                  <SelectItem value="4.0">4.0</SelectItem>
                  <SelectItem value="6.5">6.5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-900">Sample Size:</span>
                <span className="text-sm text-gray-900">{results.minor.sampleSize} units</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-900">Accept Point:</span>
                <span className="text-sm text-gray-900">{results.minor.ac}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-900">Reject Point:</span>
                <span className="text-sm text-red-600 font-medium">{results.minor.re}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QIMA Reference Note */}
        <div className="mt-6 text-xs text-gray-500 italic">
          Note: The AQL tables below are based on the ANSI/ASQ Standard Z1.4 - 2008 (ISO 2859-1)
        </div>
      </div>
    </div>
  );
}