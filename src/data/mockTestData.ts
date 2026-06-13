import { MockTest } from "../types";

export const DEFAULT_MOCK_TESTS: MockTest[] = [
  {
    testId: "upsc_mock_1",
    title: "UPSC CSE GS Paper I - National & Polity Mock",
    category: "UPSC",
    questionsCount: 5,
    durationMinutes: 10,
    difficulty: "Hard",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "upsc_q1",
        questionText: "Which of the following matches are correct regarding writs issued by the courts in India?\n1. Habeas Corpus: To have the body of.\n2. Mandamus: We command.\n3. Quo-Warranto: By what authority or warrant?\n\nSelect the correct answer using the code below:",
        options: [
          "1 and 2 only",
          "2 and 3 only",
          "1 and 3 only",
          "1, 2 and 3"
        ],
        correctOptionIndex: 3,
        explanation: "All three matches are correct. Habeas Corpus (literally 'to have the body'), Mandamus (literally 'we command'), and Quo-Warranto ('by what authority') are crucial constitutional writs in India issued under Articles 32 and 226.",
        subject: "Polity"
      },
      {
        id: "upsc_q2",
        questionText: "Consider the following statements regarding the Attorney General of India:\n1. He is appointed by the President of India.\n2. He must be a person who is qualified to be appointed a Judge of the Supreme Court.\n3. He has the right of audience in all courts in the territory of India.\n\nWhich of the statements given above are correct?",
        options: [
          "1 and 2 only",
          "2 and 3 only",
          "1 and 3 only",
          "1, 2 and 3"
        ],
        correctOptionIndex: 3,
        explanation: "Under Article 76, all three statements are correct. The Attorney General is appointed by the President, must be qualified as an SC Judge, and holds the right of audience in all territories of India.",
        subject: "Polity"
      },
      {
        id: "upsc_q3",
        questionText: "The 'Red Data Book' published by IUCN contains lists of:\n1. Endemic plant and animal species preferred for biotech research.\n2. Threatened species of plants and animals.\n3. Protected areas in biodiversity hotspots globally.\n\nSelect the correct answer using the code below:",
        options: [
          "1 and 3 only",
          "2 only",
          "1 and 2 only",
          "1, 2 and 3"
        ],
        correctOptionIndex: 1,
        explanation: "The Red Data Book deals exclusively with threatened species of plants and animals, categorizing them from least concern to extinct.",
        subject: "Ecology"
      },
      {
        id: "upsc_q4",
        questionText: "With reference to ancient Indian history, what was 'Gadhaiya' in early medieval period?",
        options: [
          "A type of agricultural land measure",
          "Currency / Coinage systems",
          "Religious text commentary",
          "Administrative title of village elders"
        ],
        correctOptionIndex: 1,
        explanation: "Gadhaiya coins were popular medieval currency items in Western India, derived from Indo-Sasanian coin designs, continuing until the Rajput dynasties.",
        subject: "History"
      },
      {
        id: "upsc_q5",
        questionText: "In India, which of the following is/are considered as part of Capital Budget?\n1. Expenditure on acquisition of assets like roads and buildings.\n2. Loans received from foreign governments.\n3. Interest payments on prior national debts.\n\nSelect the correct answer:",
        options: [
          "1 and 2 only",
          "2 and 3 only",
          "1 only",
          "1, 2 and 3"
        ],
        correctOptionIndex: 0,
        explanation: "Capital Budget list contains capital receipts (such as loans from foreign entities) and capital payments (like asset creation). Interest payments, however, belong to Revenue Budget because they are recurrent expenses.",
        subject: "Economics"
      }
    ]
  },
  {
    testId: "ssc_mock_12",
    title: "SSC CGL Tier I - Revision Mock Paper #12",
    category: "SSC",
    questionsCount: 5,
    durationMinutes: 8,
    difficulty: "Medium",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "ssc_q1",
        questionText: "In how many years will an investment of ₹12,000 double itself at 12.5% simple interest rate per annum?",
        options: [
          "6 Years",
          "8 Years",
          "10 Years",
          "7.5 Years"
        ],
        correctOptionIndex: 1,
        explanation: "Using Simple Interest formula, SI = P * R * T / 100. To double itself, SI must equal Principal (P). Therefore, P = P * 12.5 * T / 100 => T = 100 / 12.5 = 8 Years. The initial principal of ₹12,000 is irrelevant to the time required.",
        subject: "Quantitative Aptitude"
      },
      {
        id: "ssc_q2",
        questionText: "Select the antonym for the word 'DIFFERENTIATE':",
        options: [
          "Distinguish",
          "Conflate",
          "Discriminate",
          "Segregate"
        ],
        correctOptionIndex: 1,
        explanation: "To differentiate is to distinguish or recognize differences. 'Conflate' means to combine or blend multiple things into one, which is the direct opposite.",
        subject: "English Language"
      },
      {
        id: "ssc_q3",
        questionText: "In a certain code language, 'BOMBASTIC' is coded as 'AQMCZRUHD'. Under the same rule, how will 'FANTASTIC' be coded?",
        options: [
          "EZMUBRUHD",
          "EZOSZSUHD",
          "GZMTBRUHD",
          "EZMTBRUHD"
        ],
        correctOptionIndex: 3,
        explanation: "By analyzing the shift logic: F(-1)->E, A(+1)->Z (or wrapping), N(-1)->M, T(+1)->T, etc., the correct code is EZMTBRUHD.",
        subject: "Reasoning & Intelligence"
      },
      {
        id: "ssc_q4",
        questionText: "Which of the following dynasties of the Delhi Sultanate ruled for the shortest duration?",
        options: [
          "Lodi Dynasty",
          "Khilji Dynasty",
          "Tughlaq Dynasty",
          "Mamluk (Slave) Dynasty"
        ],
        correctOptionIndex: 1,
        explanation: "The Khilji Dynasty ruled for the shortest period (1290 - 1320 AD, just 30 years). The Tughlaq Dynasty ruled for the longest period (94 years).",
        subject: "General Awareness"
      },
      {
        id: "ssc_q5",
        questionText: "If x + 1/x = 5, what is the value of x² + 1/x²?",
        options: [
          "25",
          "27",
          "23",
          "20"
        ],
        correctOptionIndex: 2,
        explanation: "Squaring both sides of x + 1/x = 5: (x + 1/x)² = 25 => x² + 2 + 1/x² = 25 => x² + 1/x² = 25 - 2 = 23.",
        subject: "Quantitative Aptitude"
      }
    ]
  },
  {
    testId: "banking_mock_2",
    title: "IBPS PO Prelims - Quantitative & Reasoning Blueprint",
    category: "Banking",
    questionsCount: 5,
    durationMinutes: 10,
    difficulty: "Medium",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "bank_q1",
        questionText: "A pipe can fill a cistern in 12 hours, while another waste pipe can empty it in 20 hours. If both the pipes are opened simultaneously when the cistern is empty, how long will it take to fill the cistern completely?",
        options: [
          "30 Hours",
          "24 Hours",
          "15 Hours",
          "18 Hours"
        ],
        correctOptionIndex: 0,
        explanation: "Work done by both pipes in 1 hour = (1/12) - (1/20) = (5-3)/60 = 2/60 = 1/30. So, the time taken to fill the cistern completely is 30 Hours.",
        subject: "Quantitative Aptitude"
      },
      {
        id: "bank_q2",
        questionText: "Directions: Below are statements followed by two conclusions. Choose the correct option.\nStatements: All desks are benches. Some benches are chairs.\nConclusions:\nI. Some desks are chairs.\nII. Some benches are desks.",
        options: [
          "Only conclusion I follows",
          "Only conclusion II follows",
          "Both conclusion I and II follow",
          "Neither conclusion I nor II follows"
        ],
        correctOptionIndex: 1,
        explanation: "Since some benches are chairs, and all desks are benches, desktops do not necessarily link with chairs (Conclusion I does not follow). However, since all desks are benches, some benches must be desks (Conclusion II is always true).",
        subject: "Reasoning"
      },
      {
        id: "bank_q3",
        questionText: "What will come in place of the question mark (?) in the following series?\n7, 15, 31, 63, 127, ?",
        options: [
          "254",
          "255",
          "256",
          "249"
        ],
        correctOptionIndex: 1,
        explanation: "Each number is generated by: (Prev * 2) + 1.\n7 * 2 + 1 = 15\n15 * 2 + 1 = 31\n31 * 2 + 1 = 63\n63 * 2 + 1 = 127\n127 * 2 + 1 = 255.",
        subject: "Quantitative Aptitude"
      },
      {
        id: "bank_q4",
        questionText: "In banking terminology, what does 'NSFR' stand for?",
        options: [
          "National Standard Finance Ration",
          "Net Stable Funding Ratio",
          "Non-Systemic Financial Resource",
          "New State Fiscal Regulation"
        ],
        correctOptionIndex: 1,
        explanation: "NSFR stands for Net Stable Funding Ratio, introduced under Basel III norms to ensure banks maintain stable funding profiles relative to their asset composition.",
        subject: "Banking Awareness"
      },
      {
        id: "bank_q5",
        questionText: "In how many different ways can the letters of the word 'MOBILE' be arranged?",
        options: [
          "720 Ways",
          "120 Ways",
          "360 Ways",
          "240 Ways"
        ],
        correctOptionIndex: 0,
        explanation: "The word 'MOBILE' has 6 distinct letters. The total number of arrangements is 6! = 6 * 5 * 4 * 3 * 2 * 1 = 720.",
        subject: "Quantitative Aptitude"
      }
    ]
  },
  {
    testId: "railways_mock_3",
    title: "RRB NTPC CBT 1 - General Awareness & Science",
    category: "Railways",
    questionsCount: 5,
    durationMinutes: 8,
    difficulty: "Easy",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "rail_q1",
        questionText: "Which chemical compound is commonly known as 'Baking Soda'?",
        options: [
          "Sodium Carbonate",
          "Sodium Bicarbonate",
          "Calcium Carbonate",
          "Sodium Chloride"
        ],
        correctOptionIndex: 1,
        explanation: "Sodium Bicarbonate (NaHCO3) is commonly known as baking soda. Sodium Carbonate is washing soda.",
        subject: "General Science"
      },
      {
        id: "rail_q2",
        questionText: "The Kakrapar Atomic Power Station is located in which Indian state?",
        options: [
          "Rajasthan",
          "Gujarat",
          "Karnataka",
          "Tamil Nadu"
        ],
        correctOptionIndex: 1,
        explanation: "Kakrapar Atomic Power Station is located near Surat in Gujarat.",
        subject: "Geography"
      },
      {
        id: "rail_q3",
        questionText: "Who is known as the 'Father of Indian Railways'?",
        options: [
          "Lord Dalhousie",
          "Lord Curzon",
          "Lord Mountbatten",
          "Lord Ripon"
        ],
        correctOptionIndex: 0,
        explanation: "Lord Dalhousie is recognized as the Father of Indian Railways because he introduced railways to India (with the first run between Bombay and Thane in 1853).",
        subject: "History"
      },
      {
        id: "rail_q4",
        questionText: "Which of the following is a non-metal that remains liquid at room temperature?",
        options: [
          "Mercury",
          "Bromine",
          "Chlorine",
          "Helium"
        ],
        correctOptionIndex: 1,
        explanation: "Bromine is the only non-metallic element that is a liquid at standard room temperature. Mercury is also liquid, but it is a metal.",
        subject: "General Science"
      },
      {
        id: "rail_q5",
        questionText: "Which instrument is used to measure Atmospheric Pressure?",
        options: [
          "Hygrometer",
          "Barometer",
          "Thermometer",
          "Hydrometer"
        ],
        correctOptionIndex: 1,
        explanation: "A Barometer is used to measure atmospheric pressure, while a Hygrometer is used to measure humidity.",
        subject: "General Science"
      }
    ]
  }
];
