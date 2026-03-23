// Tabuladores de préstamos por fuente

export const LOAN_TABLES = {
  captavale: {
    name: 'CaptaVale',
    hasInsurance: false,
    availableTerms: [8, 10, 12, 14],
    table: {
      1000: { 8: 192, 10: 171, 12: 138, 14: null },
      2000: { 8: 386, 10: 326, 12: 281, 14: null },
      3000: { 8: 573, 10: 484, 12: 419, 14: null },
      4000: { 8: 754, 10: 632, 12: 560, 14: null },
      5000: { 8: 945, 10: 790, 12: 695, 14: null },
      6000: { 8: null, 10: 938, 12: 828, 14: 738 },
      7000: { 8: null, 10: 1091, 12: 961, 14: 841 },
      8000: { 8: null, 10: 1215, 12: 1089, 14: 969 },
      9000: { 8: null, 10: 1407, 12: 1207, 14: 1077 },
      10000: { 8: 1840, 10: 1565, 12: 1375, 14: 1220 }
    }
  },

  dportenis: {
    name: 'dportenis',
    hasInsurance: true,
    insuranceType: 'global', // se divide entre quincenas
    availableTerms: [8, 10, 12, 14, 16, 18, 20],
    table: {
      1000: { 8: 181, 10: 155, 12: null, 14: null, 16: null, 18: null, 20: null },
      1500: { 8: 272, 10: 233, 12: null, 14: null, 16: null, 18: null, 20: null },
      2000: { 8: 363, 10: 310, 12: 275, 14: 250, 16: 231, 18: 217, 20: 200 },
      2500: { 8: 453, 10: 388, 12: 344, 14: null, 16: null, 18: null, 20: null },
      3000: { 8: 544, 10: 465, 12: 413, 14: 375, 16: 347, 18: 325, 20: 300 },
      3500: { 8: 634, 10: 543, 12: 481, 14: 438, 16: null, 18: null, 20: null },
      4000: { 8: 725, 10: 620, 12: 550, 14: 500, 16: 463, 18: 433, 20: 400 },
      5000: { 8: 906, 10: 775, 12: 688, 14: 625, 16: 578, 18: 542, 20: 500 },
      6000: { 8: 1088, 10: 930, 12: 825, 14: 750, 16: 694, 18: 650, 20: 600 },
      7000: { 8: 1269, 10: 1085, 12: 963, 14: 875, 16: 809, 18: 758, 20: 700 },
      8000: { 8: 1450, 10: 1240, 12: 1100, 14: 1000, 16: 925, 18: 867, 20: 800 },
      9000: { 8: 1631, 10: 1395, 12: 1238, 14: 1125, 16: 1041, 18: 975, 20: 900 },
      10000: { 8: 1813, 10: 1550, 12: 1375, 14: 1250, 16: 1156, 18: 1083, 20: 1000 },
      11000: { 8: 1994, 10: 1705, 12: 1513, 14: 1375, 16: 1272, 18: 1192, 20: 1100 },
      12000: { 8: 2175, 10: 1860, 12: 1650, 14: 1500, 16: 1388, 18: 1300, 20: 1200 },
      13000: { 8: 2356, 10: 2015, 12: 1788, 14: 1625, 16: 1503, 18: 1408, 20: 1300 }
    }
  },

  salevale: {
    name: 'SaleVale',
    hasInsurance: true,
    insuranceType: 'perQuincena', // suma directa al pago
    availableTerms: [6, 8, 10, 12, 14, 16],
    table: {
      1000: { 6: 229, 8: 187, 10: 162, 12: 146, 14: 134, 16: 125 },
      1500: { 6: 335, 8: 273, 10: 235, 12: 210, 14: 193, 16: 179 },
      2000: { 6: 442, 8: 358, 10: 308, 12: 275, 14: 251, 16: 233 },
      2500: { 6: 548, 8: 444, 10: 381, 12: 340, 14: 310, 16: 288 },
      3000: { 6: 654, 8: 529, 10: 454, 12: 404, 14: 369, 16: 342 },
      3500: { 6: 761, 8: 615, 10: 527, 12: 469, 14: 427, 16: 396 },
      4000: { 6: 867, 8: 700, 10: 600, 12: 533, 14: 486, 16: 450 },
      4500: { 6: 973, 8: 786, 10: 673, 12: 598, 14: 545, 16: 504 },
      5000: { 6: 1079, 8: 871, 10: 746, 12: 663, 14: 603, 16: 559 },
      5500: { 6: 1186, 8: 957, 10: 819, 12: 727, 14: 662, 16: 613 },
      6000: { 6: 1292, 8: 1042, 10: 892, 12: 792, 14: 721, 16: 667 }
    }
  },

  valefectivo: {
    name: 'valefectivo',
    hasInsurance: true,
    insuranceType: 'perQuincena', // suma directa al pago (llamado "Fondo Protege")
    availableTerms: [6, 8, 10, 12, 14, 16],
    table: {
      1000: { 6: 244, 8: 193, 10: 164, 12: 139, 14: null, 16: null },
      2000: { 6: 487, 8: 386, 10: 328, 12: 277, 14: 243, 16: 217 },
      3000: { 6: 731, 8: 581, 10: 492, 12: 416, 14: 364, 16: 326 },
      4000: { 6: 1016, 8: 785, 10: 648, 12: 560, 14: 501, 16: 447 },
      5000: { 6: null, 8: 983, 10: 810, 12: 692, 14: 626, 16: 560 },
      6000: { 6: null, 8: 1180, 10: 971, 12: 829, 14: 751, 16: 672 },
      8000: { 6: null, 8: 1490, 10: 1234, 12: 1058, 14: 956, 16: 843 },
      10000: { 6: null, 8: 1871, 10: 1543, 12: 1317, 14: 1192, 16: 1066 },
      12000: { 6: null, 8: 2248, 10: 1850, 12: 1579, 14: 1430, 16: 1280 },
      16000: { 6: null, 8: 2980, 10: 2467, 12: 2116, 14: 1911, 16: 1685 }
    }
  }
}

// Obtener montos disponibles para una fuente
export const getAvailableAmounts = (source) => {
  const sourceData = LOAN_TABLES[source]
  if (!sourceData) return []
  return Object.keys(sourceData.table).map(Number).sort((a, b) => a - b)
}

// Obtener términos disponibles para un monto y fuente
export const getAvailableTerms = (source, amount) => {
  const sourceData = LOAN_TABLES[source]
  if (!sourceData || !sourceData.table[amount]) return []
  
  const terms = sourceData.table[amount]
  return sourceData.availableTerms.filter(term => terms[term] !== null)
}

// Obtener el pago por quincena desde el tabulador
export const getPaymentFromTable = (source, amount, term) => {
  const sourceData = LOAN_TABLES[source]
  if (!sourceData || !sourceData.table[amount]) return null
  return sourceData.table[amount][term] || null
}

// Calcular pago final con seguro
export const calculateFinalPayment = (basePayment, insurance, term, insuranceType) => {
  if (!insurance || insurance === 0) return basePayment
  
  if (insuranceType === 'global') {
    // Seguro se divide entre quincenas
    const insurancePerQuincena = insurance / term
    return basePayment + insurancePerQuincena
  } else if (insuranceType === 'perQuincena') {
    // Seguro se suma directamente
    return basePayment + insurance
  }
  
  return basePayment
}
