/**
 * DHL "Choose your location" country catalogue.
 *
 * This list mirrors the DHL Global "Choose your location" page exactly,
 * including territory-level entries (Saipan, Tortola, Tahiti, Channel
 * Islands, St. Croix, St. John, St. Thomas, Somaliland, Netherlands
 * Antilles, Nevis, Canary Islands) and the "Global" landing entry.
 *
 * Each row carries:
 *   code           — short identifier (ISO 3166-1 alpha-2 where possible;
 *                    synthetic 3-letter code for sub-territories that lack
 *                    an ISO 2-letter code — e.g. "STX" St. Croix, "CHI"
 *                    Channel Islands, "GLB" Global).
 *   name           — display name as shown on dhl.com.
 *   region         — internal region bucket retained for legacy callers.
 *   language       — primary local language (ISO 639-1 uppercase).
 *   languageLabel  — endonym used by the country chip.
 *   currency       — ISO 4217 currency code; "" for Global.
 *   currencySymbol — common currency symbol; "" for Global.
 *   locale         — BCP-47 locale tag.
 *   external       — true if the DHL site for this location is the DHL
 *                    Express division only (rendered with the ↗ icon on
 *                    the Choose Location page).
 *   flagCode       — 2-letter code used to build the Unicode flag emoji;
 *                    falls back to `code` when omitted.
 */

const C = (code, name, region, language, languageLabel, currency, currencySymbol, locale, external = false, flagCode = null) => ({
  code,
  name,
  region,
  language,
  languageLabel,
  currency,
  currencySymbol,
  locale,
  external,
  flagCode: flagCode || (code.length === 2 ? code : null),
});

const AFRICA = "Africa";
const AMERICAS = "Americas";
const ASIA = "Asia & Pacific";
const EUROPE = "Europe";
const MIDDLE_EAST = "Middle East";
const GLOBAL = "Global";

export const COUNTRIES = [
  // ─── A ─────────────────────────────────────────────────────────────────
  C("AF", "Afghanistan",               ASIA,        "PS", "پښتو",            "AFN", "؋",    "ps-AF"),
  C("AL", "Albania",                   EUROPE,      "SQ", "Shqip",           "ALL", "L",    "sq-AL"),
  C("DZ", "Algeria",                   AFRICA,      "AR", "العربية",         "DZD", "DA",   "ar-DZ"),
  C("AS", "American Samoa",            ASIA,        "EN", "English",         "USD", "$",    "en-AS",  true),
  C("AD", "Andorra",                   EUROPE,      "CA", "Català",          "EUR", "€",    "ca-AD",  true),
  C("AO", "Angola",                    AFRICA,      "PT", "Português",       "AOA", "Kz",   "pt-AO"),
  C("AI", "Anguilla",                  AMERICAS,    "EN", "English",         "XCD", "$",    "en-AI",  true),
  C("AG", "Antigua and Barbuda",       AMERICAS,    "EN", "English",         "XCD", "$",    "en-AG",  true),
  C("AR", "Argentina",                 AMERICAS,    "ES", "Español",         "ARS", "$",    "es-AR"),
  C("AM", "Armenia",                   EUROPE,      "HY", "Հայերեն",          "AMD", "֏",    "hy-AM",  true),
  C("AW", "Aruba",                     AMERICAS,    "NL", "Nederlands",      "AWG", "ƒ",    "nl-AW",  true),
  C("AU", "Australia",                 ASIA,        "EN", "English",         "AUD", "A$",   "en-AU"),
  C("AT", "Austria",                   EUROPE,      "DE", "Deutsch",         "EUR", "€",    "de-AT"),
  C("AZ", "Azerbaijan",                EUROPE,      "AZ", "Azərbaycanca",    "AZN", "₼",    "az-AZ",  true),

  // ─── B ─────────────────────────────────────────────────────────────────
  C("BS", "Bahamas",                   AMERICAS,    "EN", "English",         "BSD", "$",    "en-BS",  true),
  C("BH", "Bahrain",                   MIDDLE_EAST, "AR", "العربية",         "BHD", "BD",   "ar-BH"),
  C("BD", "Bangladesh",                ASIA,        "BN", "বাংলা",            "BDT", "৳",    "bn-BD"),
  C("BB", "Barbados",                  AMERICAS,    "EN", "English",         "BBD", "$",    "en-BB"),
  C("BE", "Belgium",                   EUROPE,      "NL", "Nederlands",      "EUR", "€",    "nl-BE"),
  C("BZ", "Belize",                    AMERICAS,    "EN", "English",         "BZD", "$",    "en-BZ"),
  C("BJ", "Benin",                     AFRICA,      "FR", "Français",        "XOF", "CFA",  "fr-BJ"),
  C("BM", "Bermuda",                   AMERICAS,    "EN", "English",         "BMD", "$",    "en-BM"),
  C("BT", "Bhutan",                    ASIA,        "DZ", "རྫོང་ཁ",            "BTN", "Nu",   "dz-BT"),
  C("BO", "Bolivia",                   AMERICAS,    "ES", "Español",         "BOB", "Bs",   "es-BO"),
  C("BQ", "Bonaire",                   AMERICAS,    "NL", "Nederlands",      "USD", "$",    "nl-BQ",  true),
  C("BA", "Bosnia and Herzegovina",    EUROPE,      "BS", "Bosanski",        "BAM", "KM",   "bs-BA"),
  C("BW", "Botswana",                  AFRICA,      "EN", "English",         "BWP", "P",    "en-BW"),
  C("BR", "Brazil",                    AMERICAS,    "PT", "Português",       "BRL", "R$",   "pt-BR"),
  C("BN", "Brunei",                    ASIA,        "MS", "Bahasa Melayu",   "BND", "B$",   "ms-BN"),
  C("BG", "Bulgaria",                  EUROPE,      "BG", "Български",       "BGN", "лв",   "bg-BG"),
  C("BF", "Burkina Faso",              AFRICA,      "FR", "Français",        "XOF", "CFA",  "fr-BF",  true),
  C("BI", "Burundi",                   AFRICA,      "FR", "Français",        "BIF", "FBu",  "fr-BI",  true),

  // ─── C ─────────────────────────────────────────────────────────────────
  C("KH", "Cambodia",                  ASIA,        "KM", "ភាសាខ្មែរ",         "KHR", "៛",    "km-KH",  true),
  C("CM", "Cameroon",                  AFRICA,      "FR", "Français",        "XAF", "FCFA", "fr-CM",  true),
  C("CA", "Canada",                    AMERICAS,    "EN", "English",         "CAD", "C$",   "en-CA"),
  C("IC", "Canary Islands",            EUROPE,      "ES", "Español",         "EUR", "€",    "es-IC",  true,  "ES"),
  C("CV", "Cape Verde",                AFRICA,      "PT", "Português",       "CVE", "$",    "pt-CV",  true),
  C("KY", "Cayman Islands",            AMERICAS,    "EN", "English",         "KYD", "$",    "en-KY",  true),
  C("CF", "Central African Republic",  AFRICA,      "FR", "Français",        "XAF", "FCFA", "fr-CF"),
  C("TD", "Chad",                      AFRICA,      "FR", "Français",        "XAF", "FCFA", "fr-TD",  true),
  C("CHI","Channel Islands",           EUROPE,      "EN", "English",         "GBP", "£",    "en-GG",  true,  "GG"),
  C("CL", "Chile",                     AMERICAS,    "ES", "Español",         "CLP", "$",    "es-CL"),
  C("CN", "China, People's Republic",  ASIA,        "ZH", "中文",              "CNY", "¥",    "zh-CN"),
  C("CO", "Colombia",                  AMERICAS,    "ES", "Español",         "COP", "$",    "es-CO"),
  C("KM", "Comoros",                   AFRICA,      "FR", "Français",        "KMF", "CF",   "fr-KM",  true),
  C("CG", "Congo",                     AFRICA,      "FR", "Français",        "XAF", "FCFA", "fr-CG"),
  C("CD", "Congo, The Democratic Republic of", AFRICA, "FR", "Français",      "CDF", "FC",   "fr-CD"),
  C("CK", "Cook Islands",              ASIA,        "EN", "English",         "NZD", "NZ$",  "en-CK"),
  C("CR", "Costa Rica",                AMERICAS,    "ES", "Español",         "CRC", "₡",    "es-CR"),
  C("HR", "Croatia",                   EUROPE,      "HR", "Hrvatski",        "EUR", "€",    "hr-HR"),
  C("CU", "Cuba",                      AMERICAS,    "ES", "Español",         "CUP", "$",    "es-CU",  true),
  C("CW", "Curacao",                   AMERICAS,    "NL", "Nederlands",      "ANG", "ƒ",    "nl-CW",  true),
  C("CY", "Cyprus",                    EUROPE,      "EL", "Ελληνικά",        "EUR", "€",    "el-CY"),
  C("CZ", "Czech Republic",            EUROPE,      "CS", "Čeština",         "CZK", "Kč",   "cs-CZ"),

  // ─── D ─────────────────────────────────────────────────────────────────
  C("DK", "Denmark",                   EUROPE,      "DA", "Dansk",           "DKK", "kr",   "da-DK"),
  C("DJ", "Djibouti",                  AFRICA,      "FR", "Français",        "DJF", "Fdj",  "fr-DJ",  true),
  C("DM", "Dominica",                  AMERICAS,    "EN", "English",         "XCD", "$",    "en-DM",  true),
  C("DO", "Dominican Republic",        AMERICAS,    "ES", "Español",         "DOP", "RD$",  "es-DO"),

  // ─── E ─────────────────────────────────────────────────────────────────
  C("TL", "East Timor",                ASIA,        "PT", "Português",       "USD", "$",    "pt-TL"),
  C("EC", "Ecuador",                   AMERICAS,    "ES", "Español",         "USD", "$",    "es-EC"),
  C("EG", "Egypt",                     AFRICA,      "AR", "العربية",         "EGP", "E£",   "ar-EG"),
  C("SV", "El Salvador",               AMERICAS,    "ES", "Español",         "USD", "$",    "es-SV"),
  C("ER", "Eritrea",                   AFRICA,      "TI", "ትግርኛ",            "ERN", "Nfk",  "ti-ER",  true),
  C("EE", "Estonia",                   EUROPE,      "ET", "Eesti",           "EUR", "€",    "et-EE"),
  C("ET", "Ethiopia",                  AFRICA,      "AM", "አማርኛ",            "ETB", "Br",   "am-ET"),

  // ─── F ─────────────────────────────────────────────────────────────────
  C("FK", "Falkland Islands",          AMERICAS,    "EN", "English",         "FKP", "£",    "en-FK",  true),
  C("FO", "Faroe Islands",             EUROPE,      "FO", "Føroyskt",        "DKK", "kr",   "fo-FO",  true),
  C("FJ", "Fiji",                      ASIA,        "EN", "English",         "FJD", "FJ$",  "en-FJ"),
  C("FI", "Finland",                   EUROPE,      "FI", "Suomi",           "EUR", "€",    "fi-FI"),
  C("FR", "France",                    EUROPE,      "FR", "Français",        "EUR", "€",    "fr-FR"),
  C("PF", "French Polynesia",          ASIA,        "FR", "Français",        "XPF", "₣",    "fr-PF",  true),

  // ─── G ─────────────────────────────────────────────────────────────────
  C("GA", "Gabon",                     AFRICA,      "FR", "Français",        "XAF", "FCFA", "fr-GA"),
  C("GM", "Gambia",                    AFRICA,      "EN", "English",         "GMD", "D",    "en-GM"),
  C("GE", "Georgia",                   EUROPE,      "KA", "ქართული",         "GEL", "₾",    "ka-GE"),
  C("DE", "Germany",                   EUROPE,      "DE", "Deutsch",         "EUR", "€",    "de-DE"),
  C("GH", "Ghana",                     AFRICA,      "EN", "English",         "GHS", "₵",    "en-GH"),
  C("GI", "Gibraltar",                 EUROPE,      "EN", "English",         "GIP", "£",    "en-GI",  true),
  C("GLB","Global",                    GLOBAL,      "EN", "English",         "",    "",     "en",    false, "UN"),
  C("GR", "Greece",                    EUROPE,      "EL", "Ελληνικά",        "EUR", "€",    "el-GR"),
  C("GL", "Greenland",                 EUROPE,      "DA", "Dansk",           "DKK", "kr",   "da-GL",  true),
  C("GD", "Grenada",                   AMERICAS,    "EN", "English",         "XCD", "$",    "en-GD",  true),
  C("GP", "Guadeloupe",                AMERICAS,    "FR", "Français",        "EUR", "€",    "fr-GP"),
  C("GU", "Guam",                      ASIA,        "EN", "English",         "USD", "$",    "en-GU",  true),
  C("GT", "Guatemala",                 AMERICAS,    "ES", "Español",         "GTQ", "Q",    "es-GT"),
  C("GG", "Guernsey",                  EUROPE,      "EN", "English",         "GBP", "£",    "en-GG",  true),
  C("GF", "Guiana (French)",           AMERICAS,    "FR", "Français",        "EUR", "€",    "fr-GF"),
  C("GW", "Guinea-Bissau",             AFRICA,      "PT", "Português",       "XOF", "CFA",  "pt-GW",  true),
  C("GQ", "Guinea-Equatorial",         AFRICA,      "ES", "Español",         "XAF", "FCFA", "es-GQ"),
  C("GN", "Guinea Republic",           AFRICA,      "FR", "Français",        "GNF", "FG",   "fr-GN"),
  C("GY", "Guyana",                    AMERICAS,    "EN", "English",         "GYD", "$",    "en-GY",  true),

  // ─── H ─────────────────────────────────────────────────────────────────
  C("HT", "Haiti",                     AMERICAS,    "FR", "Français",        "HTG", "G",    "fr-HT"),
  C("HN", "Honduras",                  AMERICAS,    "ES", "Español",         "HNL", "L",    "es-HN"),
  C("HK", "Hong Kong, SAR China",      ASIA,        "ZH", "中文",              "HKD", "HK$",  "zh-HK"),
  C("HU", "Hungary",                   EUROPE,      "HU", "Magyar",          "HUF", "Ft",   "hu-HU"),

  // ─── I ─────────────────────────────────────────────────────────────────
  C("IS", "Iceland",                   EUROPE,      "IS", "Íslenska",        "ISK", "kr",   "is-IS"),
  C("IN", "India",                     ASIA,        "HI", "हिन्दी",            "INR", "₹",    "hi-IN"),
  C("ID", "Indonesia",                 ASIA,        "ID", "Bahasa Indonesia","IDR", "Rp",   "id-ID"),
  C("IR", "Iran",                      MIDDLE_EAST, "FA", "فارسی",           "IRR", "﷼",   "fa-IR"),
  C("IQ", "Iraq",                      MIDDLE_EAST, "AR", "العربية",         "IQD", "ID",   "ar-IQ"),
  C("IE", "Ireland, Republic of",      EUROPE,      "EN", "English",         "EUR", "€",    "en-IE"),
  C("IL", "Israel",                    MIDDLE_EAST, "HE", "עברית",           "ILS", "₪",   "he-IL"),
  C("IT", "Italy",                     EUROPE,      "IT", "Italiano",        "EUR", "€",    "it-IT"),
  C("CI", "Ivory Coast",               AFRICA,      "FR", "Français",        "XOF", "CFA",  "fr-CI"),

  // ─── J ─────────────────────────────────────────────────────────────────
  C("JM", "Jamaica",                   AMERICAS,    "EN", "English",         "JMD", "$",    "en-JM",  true),
  C("JP", "Japan",                     ASIA,        "JA", "日本語",            "JPY", "¥",    "ja-JP"),
  C("JE", "Jersey",                    EUROPE,      "EN", "English",         "GBP", "£",    "en-JE",  true),
  C("JO", "Jordan",                    MIDDLE_EAST, "AR", "العربية",         "JOD", "JD",   "ar-JO"),

  // ─── K ─────────────────────────────────────────────────────────────────
  C("KZ", "Kazakhstan",                ASIA,        "KK", "Қазақша",         "KZT", "₸",    "kk-KZ"),
  C("KE", "Kenya",                     AFRICA,      "EN", "English",         "KES", "KSh",  "en-KE"),
  C("KI", "Kiribati",                  ASIA,        "EN", "English",         "AUD", "A$",   "en-KI",  true),
  C("KR", "Korea, Republic of",        ASIA,        "KO", "한국어",           "KRW", "₩",    "ko-KR"),
  C("KP", "Korea, The D.P.R of",       ASIA,        "KO", "한국어",           "KPW", "₩",    "ko-KP",  true),
  C("XK", "Kosovo",                    EUROPE,      "SQ", "Shqip",           "EUR", "€",    "sq-XK",  true,  "XK"),
  C("KW", "Kuwait",                    MIDDLE_EAST, "AR", "العربية",         "KWD", "KD",   "ar-KW"),
  C("KG", "Kyrgyzstan",                ASIA,        "KY", "Кыргызча",        "KGS", "лв",   "ky-KG",  true),

  // ─── L ─────────────────────────────────────────────────────────────────
  C("LA", "Laos",                      ASIA,        "LO", "ລາວ",              "LAK", "₭",    "lo-LA"),
  C("LV", "Latvia",                    EUROPE,      "LV", "Latviešu",        "EUR", "€",    "lv-LV"),
  C("LB", "Lebanon",                   MIDDLE_EAST, "AR", "العربية",         "LBP", "L£",   "ar-LB"),
  C("LS", "Lesotho",                   AFRICA,      "EN", "English",         "LSL", "L",    "en-LS"),
  C("LR", "Liberia",                   AFRICA,      "EN", "English",         "LRD", "$",    "en-LR",  true),
  C("LY", "Libya",                     AFRICA,      "AR", "العربية",         "LYD", "LD",   "ar-LY",  true),
  C("LI", "Liechtenstein",             EUROPE,      "DE", "Deutsch",         "CHF", "CHF",  "de-LI",  true),
  C("LT", "Lithuania",                 EUROPE,      "LT", "Lietuvių",        "EUR", "€",    "lt-LT"),
  C("LU", "Luxembourg",                EUROPE,      "FR", "Français",        "EUR", "€",    "fr-LU"),

  // ─── M ─────────────────────────────────────────────────────────────────
  C("MO", "Macau, SAR China",          ASIA,        "ZH", "中文",              "MOP", "MOP$", "zh-MO"),
  C("MG", "Madagascar",                AFRICA,      "FR", "Français",        "MGA", "Ar",   "fr-MG"),
  C("MW", "Malawi",                    AFRICA,      "EN", "English",         "MWK", "MK",   "en-MW"),
  C("MY", "Malaysia",                  ASIA,        "MS", "Bahasa Melayu",   "MYR", "RM",   "ms-MY"),
  C("MV", "Maldives",                  ASIA,        "DV", "ދިވެހި",            "MVR", "Rf",   "dv-MV"),
  C("ML", "Mali",                      AFRICA,      "FR", "Français",        "XOF", "CFA",  "fr-ML"),
  C("MT", "Malta",                     EUROPE,      "MT", "Malti",           "EUR", "€",    "mt-MT"),
  C("MH", "Marshall Islands",          ASIA,        "EN", "English",         "USD", "$",    "en-MH",  true),
  C("MQ", "Martinique",                AMERICAS,    "FR", "Français",        "EUR", "€",    "fr-MQ"),
  C("MR", "Mauritania",                AFRICA,      "AR", "العربية",         "MRU", "UM",   "ar-MR",  true),
  C("MU", "Mauritius",                 AFRICA,      "EN", "English",         "MUR", "₨",    "en-MU"),
  C("YT", "Mayotte",                   AFRICA,      "FR", "Français",        "EUR", "€",    "fr-YT",  true),
  C("MX", "Mexico",                    AMERICAS,    "ES", "Español",         "MXN", "$",    "es-MX"),
  C("FM", "Micronesia",                ASIA,        "EN", "English",         "USD", "$",    "en-FM",  true),
  C("MD", "Moldova, Republic of",      EUROPE,      "RO", "Română",          "MDL", "L",    "ro-MD",  true),
  C("MC", "Monaco",                    EUROPE,      "FR", "Français",        "EUR", "€",    "fr-MC",  true),
  C("MN", "Mongolia",                  ASIA,        "MN", "Монгол",          "MNT", "₮",    "mn-MN"),
  C("ME", "Montenegro",                EUROPE,      "SR", "Crnogorski",      "EUR", "€",    "sr-ME",  true),
  C("MS", "Montserrat",                AMERICAS,    "EN", "English",         "XCD", "$",    "en-MS",  true),
  C("MA", "Morocco",                   AFRICA,      "AR", "العربية",         "MAD", "DH",   "ar-MA"),
  C("MZ", "Mozambique",                AFRICA,      "PT", "Português",       "MZN", "MT",   "pt-MZ"),
  C("MM", "Myanmar",                   ASIA,        "MY", "မြန်မာ",            "MMK", "K",    "my-MM"),

  // ─── N ─────────────────────────────────────────────────────────────────
  C("NA", "Namibia",                   AFRICA,      "EN", "English",         "NAD", "$",    "en-NA"),
  C("NR", "Nauru",                     ASIA,        "EN", "English",         "AUD", "A$",   "en-NR",  true),
  C("NP", "Nepal",                     ASIA,        "NE", "नेपाली",            "NPR", "₨",    "ne-NP"),
  C("NL", "Netherlands",               EUROPE,      "NL", "Nederlands",      "EUR", "€",    "nl-NL"),
  C("AN", "Netherlands Antilles",      AMERICAS,    "NL", "Nederlands",      "ANG", "ƒ",    "nl-CW",  false, "CW"),
  C("NC", "New Caledonia",             ASIA,        "FR", "Français",        "XPF", "₣",    "fr-NC",  true),
  C("NZ", "New Zealand",               ASIA,        "EN", "English",         "NZD", "NZ$",  "en-NZ"),
  C("NEV","Nevis",                     AMERICAS,    "EN", "English",         "XCD", "$",    "en-KN",  true,  "KN"),
  C("NI", "Nicaragua",                 AMERICAS,    "ES", "Español",         "NIO", "C$",   "es-NI"),
  C("NE", "Niger",                     AFRICA,      "FR", "Français",        "XOF", "CFA",  "fr-NE",  true),
  C("NG", "Nigeria",                   AFRICA,      "EN", "English",         "NGN", "₦",    "en-NG"),
  C("NU", "Niue",                      ASIA,        "EN", "English",         "NZD", "NZ$",  "en-NU",  true),
  C("MK", "North Macedonia, Republic of", EUROPE,   "MK", "Македонски",      "MKD", "ден",  "mk-MK"),
  C("MP", "Northern Mariana Islands",  ASIA,        "EN", "English",         "USD", "$",    "en-MP",  true),
  C("NO", "Norway",                    EUROPE,      "NO", "Norsk",           "NOK", "kr",   "no-NO"),

  // ─── O ─────────────────────────────────────────────────────────────────
  C("OM", "Oman",                      MIDDLE_EAST, "AR", "العربية",         "OMR", "OMR",  "ar-OM"),

  // ─── P ─────────────────────────────────────────────────────────────────
  C("PK", "Pakistan",                  ASIA,        "UR", "اردو",            "PKR", "₨",    "ur-PK"),
  C("PW", "Palau",                     ASIA,        "EN", "English",         "USD", "$",    "en-PW",  true),
  C("PA", "Panama",                    AMERICAS,    "ES", "Español",         "PAB", "B/.",  "es-PA"),
  C("PG", "Papua New Guinea",          ASIA,        "EN", "English",         "PGK", "K",    "en-PG"),
  C("PY", "Paraguay",                  AMERICAS,    "ES", "Español",         "PYG", "₲",    "es-PY"),
  C("PE", "Peru",                      AMERICAS,    "ES", "Español",         "PEN", "S/",   "es-PE"),
  C("PH", "Philippines",               ASIA,        "TL", "Filipino",        "PHP", "₱",    "tl-PH"),
  C("PL", "Poland",                    EUROPE,      "PL", "Polski",          "PLN", "zł",   "pl-PL"),
  C("PT", "Portugal",                  EUROPE,      "PT", "Português",       "EUR", "€",    "pt-PT"),
  C("PR", "Puerto Rico",               AMERICAS,    "ES", "Español",         "USD", "$",    "es-PR"),

  // ─── Q ─────────────────────────────────────────────────────────────────
  C("QA", "Qatar",                     MIDDLE_EAST, "AR", "العربية",         "QAR", "QR",   "ar-QA"),

  // ─── R ─────────────────────────────────────────────────────────────────
  C("RE", "Réunion",                   AFRICA,      "FR", "Français",        "EUR", "€",    "fr-RE"),
  C("RO", "Romania",                   EUROPE,      "RO", "Română",          "RON", "lei",  "ro-RO"),
  C("RU", "Russian Federation",        EUROPE,      "RU", "Русский",         "RUB", "₽",    "ru-RU"),
  C("RW", "Rwanda",                    AFRICA,      "EN", "English",         "RWF", "RF",   "en-RW",  true),

  // ─── S ─────────────────────────────────────────────────────────────────
  C("SPN","Saipan",                    ASIA,        "EN", "English",         "USD", "$",    "en-MP",  true,  "MP"),
  C("WS", "Samoa",                     ASIA,        "EN", "English",         "WST", "T",    "en-WS"),
  C("SM", "San Marino",                EUROPE,      "IT", "Italiano",        "EUR", "€",    "it-SM",  true),
  C("ST", "Sao Tome and Principe",     AFRICA,      "PT", "Português",       "STN", "Db",   "pt-ST",  true),
  C("SA", "Saudi Arabia",              MIDDLE_EAST, "AR", "العربية",         "SAR", "SR",   "ar-SA"),
  C("SN", "Senegal",                   AFRICA,      "FR", "Français",        "XOF", "CFA",  "fr-SN"),
  C("RS", "Serbia",                    EUROPE,      "SR", "Српски",          "RSD", "din",  "sr-RS"),
  C("SC", "Seychelles",                AFRICA,      "EN", "English",         "SCR", "₨",    "en-SC"),
  C("SL", "Sierra Leone",              AFRICA,      "EN", "English",         "SLE", "Le",   "en-SL"),
  C("SG", "Singapore",                 ASIA,        "EN", "English",         "SGD", "S$",   "en-SG"),
  C("SK", "Slovakia",                  EUROPE,      "SK", "Slovenčina",      "EUR", "€",    "sk-SK"),
  C("SI", "Slovenia",                  EUROPE,      "SL", "Slovenščina",     "EUR", "€",    "sl-SI"),
  C("SB", "Solomon Islands",           ASIA,        "EN", "English",         "SBD", "SI$",  "en-SB",  true),
  C("SO", "Somalia",                   AFRICA,      "SO", "Soomaali",        "SOS", "Sh",   "so-SO",  true),
  C("SOL","Somaliland",                AFRICA,      "SO", "Soomaali",        "SOS", "Sh",   "so-SO",  true,  "SO"),
  C("ZA", "South Africa",              AFRICA,      "EN", "English",         "ZAR", "R",    "en-ZA"),
  C("SS", "South Sudan",               AFRICA,      "EN", "English",         "SSP", "£",    "en-SS"),
  C("ES", "Spain",                     EUROPE,      "ES", "Español",         "EUR", "€",    "es-ES"),
  C("LK", "Sri Lanka",                 ASIA,        "SI", "සිංහල",            "LKR", "₨",    "si-LK"),
  C("BL", "St. Barthélemy",            AMERICAS,    "FR", "Français",        "EUR", "€",    "fr-BL",  true),
  C("STX","St. Croix",                 AMERICAS,    "EN", "English",         "USD", "$",    "en-VI",  false, "VI"),
  C("STE","St. Eustatius",             AMERICAS,    "NL", "Nederlands",      "USD", "$",    "nl-BQ",  true,  "BQ"),
  C("SH", "St. Helena",                AFRICA,      "EN", "English",         "SHP", "£",    "en-SH"),
  C("STJ","St. John",                  AMERICAS,    "EN", "English",         "USD", "$",    "en-VI",  false, "VI"),
  C("KN", "St. Kitts",                 AMERICAS,    "EN", "English",         "XCD", "$",    "en-KN",  true),
  C("LC", "St. Lucia",                 AMERICAS,    "EN", "English",         "XCD", "$",    "en-LC",  true),
  C("SX", "St. Maarten",               AMERICAS,    "NL", "Nederlands",      "ANG", "ƒ",    "nl-SX"),
  C("STT","St. Thomas",                AMERICAS,    "EN", "English",         "USD", "$",    "en-VI",  true,  "VI"),
  C("VC", "St. Vincent",               AMERICAS,    "EN", "English",         "XCD", "$",    "en-VC",  true),
  C("SD", "Sudan",                     AFRICA,      "AR", "العربية",         "SDG", "£",    "ar-SD"),
  C("SR", "Suriname",                  AMERICAS,    "NL", "Nederlands",      "SRD", "$",    "nl-SR",  true),
  C("SZ", "Swaziland",                 AFRICA,      "EN", "English",         "SZL", "E",    "en-SZ"),
  C("SE", "Sweden",                    EUROPE,      "SV", "Svenska",         "SEK", "kr",   "sv-SE"),
  C("CH", "Switzerland",               EUROPE,      "DE", "Deutsch",         "CHF", "CHF",  "de-CH"),
  C("SY", "Syria",                     MIDDLE_EAST, "AR", "العربية",         "SYP", "S£",   "ar-SY"),

  // ─── T ─────────────────────────────────────────────────────────────────
  C("TAH","Tahiti",                    ASIA,        "FR", "Français",        "XPF", "₣",    "fr-PF",  true,  "PF"),
  C("TW", "Taiwan, China",             ASIA,        "ZH", "中文",              "TWD", "NT$",  "zh-TW"),
  C("TJ", "Tajikistan",                ASIA,        "TG", "Тоҷикӣ",          "TJS", "SM",   "tg-TJ",  true),
  C("TZ", "Tanzania",                  AFRICA,      "SW", "Kiswahili",       "TZS", "TSh",  "sw-TZ"),
  C("TH", "Thailand",                  ASIA,        "TH", "ไทย",              "THB", "฿",    "th-TH"),
  C("TG", "Togo",                      AFRICA,      "FR", "Français",        "XOF", "CFA",  "fr-TG",  true),
  C("TO", "Tonga",                     ASIA,        "EN", "English",         "TOP", "T$",   "en-TO",  true),
  C("TRT","Tortola",                   AMERICAS,    "EN", "English",         "USD", "$",    "en-VG",  false, "VG"),
  C("TT", "Trinidad and Tobago",       AMERICAS,    "EN", "English",         "TTD", "$",    "en-TT"),
  C("TN", "Tunisia",                   AFRICA,      "AR", "العربية",         "TND", "DT",   "ar-TN",  true),
  C("TR", "Turkey",                    MIDDLE_EAST, "TR", "Türkçe",          "TRY", "₺",    "tr-TR"),
  C("TM", "Turkmenistan",              ASIA,        "TK", "Türkmen",         "TMT", "m",    "tk-TM",  true),
  C("TC", "Turks and Caicos Islands",  AMERICAS,    "EN", "English",         "USD", "$",    "en-TC",  true),
  C("TV", "Tuvalu",                    ASIA,        "EN", "English",         "AUD", "A$",   "en-TV",  true),

  // ─── U ─────────────────────────────────────────────────────────────────
  C("UG", "Uganda",                    AFRICA,      "EN", "English",         "UGX", "USh",  "en-UG"),
  C("UA", "Ukraine",                   EUROPE,      "UK", "Українська",      "UAH", "₴",    "uk-UA"),
  C("AE", "United Arab Emirates",      MIDDLE_EAST, "AR", "العربية",         "AED", "AED",  "ar-AE"),
  C("GB", "United Kingdom",            EUROPE,      "EN", "English",         "GBP", "£",    "en-GB"),
  C("US", "United States of America",  AMERICAS,    "EN", "English",         "USD", "$",    "en-US"),
  C("UY", "Uruguay",                   AMERICAS,    "ES", "Español",         "UYU", "$",    "es-UY"),
  C("UZ", "Uzbekistan",                ASIA,        "UZ", "Oʻzbekcha",       "UZS", "лв",   "uz-UZ",  true),

  // ─── V ─────────────────────────────────────────────────────────────────
  C("VU", "Vanuatu",                   ASIA,        "EN", "English",         "VUV", "VT",   "en-VU",  true),
  C("VE", "Venezuela",                 AMERICAS,    "ES", "Español",         "VES", "Bs.S", "es-VE"),
  C("VN", "Vietnam",                   ASIA,        "VI", "Tiếng Việt",      "VND", "₫",    "vi-VN"),
  C("VG", "Virgin Islands (British)",  AMERICAS,    "EN", "English",         "USD", "$",    "en-VG"),
  C("VI", "Virgin Islands (US)",       AMERICAS,    "EN", "English",         "USD", "$",    "en-VI",  true),

  // ─── Y ─────────────────────────────────────────────────────────────────
  C("YE", "Yemen",                     MIDDLE_EAST, "AR", "العربية",         "YER", "YR",   "ar-YE"),

  // ─── Z ─────────────────────────────────────────────────────────────────
  C("ZM", "Zambia",                    AFRICA,      "EN", "English",         "ZMW", "K",    "en-ZM"),
  C("ZW", "Zimbabwe",                  AFRICA,      "EN", "English",         "USD", "$",    "en-ZW"),
];

export const REGIONS = [AFRICA, AMERICAS, ASIA, EUROPE, MIDDLE_EAST];

/**
 * Default country for first-time visitors. SG = Singapore — the demo's
 * home market after the Faz 9e country pivot. The previous PG default
 * is still selectable from the picker.
 */
export const DEFAULT_COUNTRY_CODE = "SG";

export const findCountry = (code) =>
  COUNTRIES.find((c) => c.code === code) ||
  COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY_CODE);

/**
 * Convert a 2-letter ISO country code to a Unicode flag emoji using
 * Regional Indicator Symbols. e.g. "DE" -> 🇩🇪. Returns the globe glyph for
 * non-letter codes (defensive fallback for unknown codes like "GLB" or
 * synthetic territory codes that opt out via flagCode=null).
 *
 * Accepts either a raw 2-letter string or a country object with a
 * `flagCode` field — when a country is passed the function honours the
 * synthetic flag mapping (Saipan → MP flag, Channel Islands → GG flag,
 * Tortola → VG flag, etc.).
 */
export const flagFor = (input) => {
  if (!input) return "🌐";
  // Country object passed in: prefer its flagCode field.
  if (typeof input === "object") {
    const code = input.flagCode || input.code;
    return flagFor(code);
  }
  if (input === "UN" || input.length !== 2) return "🌐";
  const A = 0x1f1e6;
  const upper = String(input).toUpperCase();
  const cp1 = A + (upper.charCodeAt(0) - 65);
  const cp2 = A + (upper.charCodeAt(1) - 65);
  if (cp1 < A || cp2 < A) return "🌐";
  return String.fromCodePoint(cp1) + String.fromCodePoint(cp2);
};

/**
 * "Jump to" letter buckets shown at the top of the Choose Location page.
 * Each bucket spans an inclusive letter range — clicking the chip scrolls
 * the matching `<section>` into view. We pre-define the buckets DHL uses
 * (A–D / E–H / I–L / M–P / Q–T / U–Z) rather than auto-deriving them so
 * the layout matches dhl.com exactly even when a letter (e.g. "X") is
 * empty.
 */
export const JUMP_TO_BUCKETS = [
  { id: "ad", label: "A - D", from: "A", to: "D" },
  { id: "eh", label: "E - H", from: "E", to: "H" },
  { id: "il", label: "I - L", from: "I", to: "L" },
  { id: "mp", label: "M - P", from: "M", to: "P" },
  { id: "qt", label: "Q - T", from: "Q", to: "T" },
  { id: "uz", label: "U - Z", from: "U", to: "Z" },
];

/**
 * Bucket countries by first letter into an array of `{ letter, items }`
 * groups, alphabetically sorted. Empty letters are omitted. Used by the
 * Choose Location page to render the A/B/C/… section list.
 */
export const COUNTRIES_BY_LETTER = (() => {
  const buckets = {};
  for (const c of COUNTRIES) {
    const letter = c.name[0].toUpperCase();
    if (!buckets[letter]) buckets[letter] = [];
    buckets[letter].push(c);
  }
  return Object.keys(buckets)
    .sort()
    .map((letter) => ({
      letter,
      items: buckets[letter].sort((a, b) => a.name.localeCompare(b.name)),
    }));
})();
