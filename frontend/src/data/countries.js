/**
 * ISO 3166-1 country catalogue used by the DHL Global Forwarding pitch demo.
 *
 * Each entry maps a country to its primary language and official trading
 * currency. The list is intentionally hand-authored from public ISO 3166-1 /
 * ISO 4217 / ISO 639-1 data so we don't need a runtime npm dependency just to
 * power the utility-bar country picker.
 *
 * Regions are bucketed into the 5 buckets used by the picker UI so the
 * dropdown remains scannable: Africa, Americas, Asia & Pacific, Europe,
 * Middle East.
 *
 * Currency is the country's official tender. We DO NOT do FX conversion in
 * the demo — switching country only re-labels amounts in the displayed
 * currency. Where multiple currencies are in circulation we pick the most
 * widely accepted one (e.g. Zimbabwe -> USD, El Salvador -> USD).
 *
 * `language` is the ISO 639-1 primary language code (uppercase as per spec).
 * `languageLabel` is the language name in the language itself (endonym).
 * `locale` is a BCP-47 tag suitable for `Intl.NumberFormat`.
 */

const C = (code, name, region, language, languageLabel, currency, currencySymbol, locale) => ({
  code,
  name,
  region,
  language,
  languageLabel,
  currency,
  currencySymbol,
  locale,
});

const AFRICA = "Africa";
const AMERICAS = "Americas";
const ASIA = "Asia & Pacific";
const EUROPE = "Europe";
const MIDDLE_EAST = "Middle East";

export const COUNTRIES = [
  // ─── AFRICA ────────────────────────────────────────────────────────────
  C("DZ", "Algeria",               AFRICA, "AR", "العربية",     "DZD", "DA",   "ar-DZ"),
  C("AO", "Angola",                AFRICA, "PT", "Português",   "AOA", "Kz",   "pt-AO"),
  C("BJ", "Benin",                 AFRICA, "FR", "Français",    "XOF", "CFA",  "fr-BJ"),
  C("BW", "Botswana",              AFRICA, "EN", "English",     "BWP", "P",    "en-BW"),
  C("BF", "Burkina Faso",          AFRICA, "FR", "Français",    "XOF", "CFA",  "fr-BF"),
  C("BI", "Burundi",               AFRICA, "FR", "Français",    "BIF", "FBu",  "fr-BI"),
  C("CM", "Cameroon",              AFRICA, "FR", "Français",    "XAF", "FCFA", "fr-CM"),
  C("CV", "Cape Verde",            AFRICA, "PT", "Português",   "CVE", "$",    "pt-CV"),
  C("CF", "Central African Republic", AFRICA, "FR", "Français", "XAF", "FCFA", "fr-CF"),
  C("TD", "Chad",                  AFRICA, "FR", "Français",    "XAF", "FCFA", "fr-TD"),
  C("KM", "Comoros",               AFRICA, "FR", "Français",    "KMF", "CF",   "fr-KM"),
  C("CG", "Congo",                 AFRICA, "FR", "Français",    "XAF", "FCFA", "fr-CG"),
  C("CD", "Congo (DRC)",           AFRICA, "FR", "Français",    "CDF", "FC",   "fr-CD"),
  C("CI", "Côte d'Ivoire",         AFRICA, "FR", "Français",    "XOF", "CFA",  "fr-CI"),
  C("DJ", "Djibouti",              AFRICA, "FR", "Français",    "DJF", "Fdj",  "fr-DJ"),
  C("EG", "Egypt",                 AFRICA, "AR", "العربية",     "EGP", "E£",   "ar-EG"),
  C("GQ", "Equatorial Guinea",     AFRICA, "ES", "Español",     "XAF", "FCFA", "es-GQ"),
  C("ER", "Eritrea",               AFRICA, "TI", "ትግርኛ",        "ERN", "Nfk",  "ti-ER"),
  C("SZ", "Eswatini",              AFRICA, "EN", "English",     "SZL", "E",    "en-SZ"),
  C("ET", "Ethiopia",              AFRICA, "AM", "አማርኛ",        "ETB", "Br",   "am-ET"),
  C("GA", "Gabon",                 AFRICA, "FR", "Français",    "XAF", "FCFA", "fr-GA"),
  C("GM", "Gambia",                AFRICA, "EN", "English",     "GMD", "D",    "en-GM"),
  C("GH", "Ghana",                 AFRICA, "EN", "English",     "GHS", "₵",    "en-GH"),
  C("GN", "Guinea",                AFRICA, "FR", "Français",    "GNF", "FG",   "fr-GN"),
  C("GW", "Guinea-Bissau",         AFRICA, "PT", "Português",   "XOF", "CFA",  "pt-GW"),
  C("KE", "Kenya",                 AFRICA, "EN", "English",     "KES", "KSh",  "en-KE"),
  C("LS", "Lesotho",               AFRICA, "EN", "English",     "LSL", "L",    "en-LS"),
  C("LR", "Liberia",               AFRICA, "EN", "English",     "LRD", "$",    "en-LR"),
  C("LY", "Libya",                 AFRICA, "AR", "العربية",     "LYD", "LD",   "ar-LY"),
  C("MG", "Madagascar",            AFRICA, "FR", "Français",    "MGA", "Ar",   "fr-MG"),
  C("MW", "Malawi",                AFRICA, "EN", "English",     "MWK", "MK",   "en-MW"),
  C("ML", "Mali",                  AFRICA, "FR", "Français",    "XOF", "CFA",  "fr-ML"),
  C("MR", "Mauritania",            AFRICA, "AR", "العربية",     "MRU", "UM",   "ar-MR"),
  C("MU", "Mauritius",             AFRICA, "EN", "English",     "MUR", "₨",    "en-MU"),
  C("YT", "Mayotte",               AFRICA, "FR", "Français",    "EUR", "€",    "fr-YT"),
  C("MA", "Morocco",               AFRICA, "AR", "العربية",     "MAD", "DH",   "ar-MA"),
  C("MZ", "Mozambique",            AFRICA, "PT", "Português",   "MZN", "MT",   "pt-MZ"),
  C("NA", "Namibia",               AFRICA, "EN", "English",     "NAD", "$",    "en-NA"),
  C("NE", "Niger",                 AFRICA, "FR", "Français",    "XOF", "CFA",  "fr-NE"),
  C("NG", "Nigeria",               AFRICA, "EN", "English",     "NGN", "₦",    "en-NG"),
  C("RE", "Réunion",               AFRICA, "FR", "Français",    "EUR", "€",    "fr-RE"),
  C("RW", "Rwanda",                AFRICA, "EN", "English",     "RWF", "RF",   "en-RW"),
  C("SH", "Saint Helena",          AFRICA, "EN", "English",     "SHP", "£",    "en-SH"),
  C("ST", "São Tomé & Príncipe",   AFRICA, "PT", "Português",   "STN", "Db",   "pt-ST"),
  C("SN", "Senegal",               AFRICA, "FR", "Français",    "XOF", "CFA",  "fr-SN"),
  C("SC", "Seychelles",            AFRICA, "EN", "English",     "SCR", "₨",    "en-SC"),
  C("SL", "Sierra Leone",          AFRICA, "EN", "English",     "SLE", "Le",   "en-SL"),
  C("SO", "Somalia",               AFRICA, "SO", "Soomaali",    "SOS", "Sh",   "so-SO"),
  C("ZA", "South Africa",          AFRICA, "EN", "English",     "ZAR", "R",    "en-ZA"),
  C("SS", "South Sudan",           AFRICA, "EN", "English",     "SSP", "£",    "en-SS"),
  C("SD", "Sudan",                 AFRICA, "AR", "العربية",     "SDG", "£",    "ar-SD"),
  C("TZ", "Tanzania",              AFRICA, "SW", "Kiswahili",   "TZS", "TSh",  "sw-TZ"),
  C("TG", "Togo",                  AFRICA, "FR", "Français",    "XOF", "CFA",  "fr-TG"),
  C("TN", "Tunisia",               AFRICA, "AR", "العربية",     "TND", "DT",   "ar-TN"),
  C("UG", "Uganda",                AFRICA, "EN", "English",     "UGX", "USh",  "en-UG"),
  C("EH", "Western Sahara",        AFRICA, "AR", "العربية",     "MAD", "DH",   "ar-EH"),
  C("ZM", "Zambia",                AFRICA, "EN", "English",     "ZMW", "K",    "en-ZM"),
  C("ZW", "Zimbabwe",              AFRICA, "EN", "English",     "USD", "$",    "en-ZW"),

  // ─── AMERICAS ──────────────────────────────────────────────────────────
  C("AI", "Anguilla",              AMERICAS, "EN", "English",   "XCD", "$",    "en-AI"),
  C("AG", "Antigua & Barbuda",     AMERICAS, "EN", "English",   "XCD", "$",    "en-AG"),
  C("AR", "Argentina",             AMERICAS, "ES", "Español",   "ARS", "$",    "es-AR"),
  C("AW", "Aruba",                 AMERICAS, "NL", "Nederlands","AWG", "ƒ",    "nl-AW"),
  C("BS", "Bahamas",               AMERICAS, "EN", "English",   "BSD", "$",    "en-BS"),
  C("BB", "Barbados",              AMERICAS, "EN", "English",   "BBD", "$",    "en-BB"),
  C("BZ", "Belize",                AMERICAS, "EN", "English",   "BZD", "$",    "en-BZ"),
  C("BM", "Bermuda",               AMERICAS, "EN", "English",   "BMD", "$",    "en-BM"),
  C("BO", "Bolivia",               AMERICAS, "ES", "Español",   "BOB", "Bs",   "es-BO"),
  C("BQ", "Bonaire",               AMERICAS, "NL", "Nederlands","USD", "$",    "nl-BQ"),
  C("BR", "Brazil",                AMERICAS, "PT", "Português", "BRL", "R$",   "pt-BR"),
  C("VG", "British Virgin Islands",AMERICAS, "EN", "English",   "USD", "$",    "en-VG"),
  C("CA", "Canada",                AMERICAS, "EN", "English",   "CAD", "C$",   "en-CA"),
  C("KY", "Cayman Islands",        AMERICAS, "EN", "English",   "KYD", "$",    "en-KY"),
  C("CL", "Chile",                 AMERICAS, "ES", "Español",   "CLP", "$",    "es-CL"),
  C("CO", "Colombia",              AMERICAS, "ES", "Español",   "COP", "$",    "es-CO"),
  C("CR", "Costa Rica",            AMERICAS, "ES", "Español",   "CRC", "₡",    "es-CR"),
  C("CU", "Cuba",                  AMERICAS, "ES", "Español",   "CUP", "$",    "es-CU"),
  C("CW", "Curaçao",               AMERICAS, "NL", "Nederlands","ANG", "ƒ",    "nl-CW"),
  C("DM", "Dominica",              AMERICAS, "EN", "English",   "XCD", "$",    "en-DM"),
  C("DO", "Dominican Republic",    AMERICAS, "ES", "Español",   "DOP", "RD$",  "es-DO"),
  C("EC", "Ecuador",               AMERICAS, "ES", "Español",   "USD", "$",    "es-EC"),
  C("SV", "El Salvador",           AMERICAS, "ES", "Español",   "USD", "$",    "es-SV"),
  C("FK", "Falkland Islands",      AMERICAS, "EN", "English",   "FKP", "£",    "en-FK"),
  C("GF", "French Guiana",         AMERICAS, "FR", "Français",  "EUR", "€",    "fr-GF"),
  C("GD", "Grenada",               AMERICAS, "EN", "English",   "XCD", "$",    "en-GD"),
  C("GP", "Guadeloupe",            AMERICAS, "FR", "Français",  "EUR", "€",    "fr-GP"),
  C("GT", "Guatemala",             AMERICAS, "ES", "Español",   "GTQ", "Q",    "es-GT"),
  C("GY", "Guyana",                AMERICAS, "EN", "English",   "GYD", "$",    "en-GY"),
  C("HT", "Haiti",                 AMERICAS, "FR", "Français",  "HTG", "G",    "fr-HT"),
  C("HN", "Honduras",              AMERICAS, "ES", "Español",   "HNL", "L",    "es-HN"),
  C("JM", "Jamaica",               AMERICAS, "EN", "English",   "JMD", "$",    "en-JM"),
  C("MQ", "Martinique",            AMERICAS, "FR", "Français",  "EUR", "€",    "fr-MQ"),
  C("MX", "Mexico",                AMERICAS, "ES", "Español",   "MXN", "$",    "es-MX"),
  C("MS", "Montserrat",            AMERICAS, "EN", "English",   "XCD", "$",    "en-MS"),
  C("NI", "Nicaragua",             AMERICAS, "ES", "Español",   "NIO", "C$",   "es-NI"),
  C("PA", "Panama",                AMERICAS, "ES", "Español",   "PAB", "B/.",  "es-PA"),
  C("PY", "Paraguay",              AMERICAS, "ES", "Español",   "PYG", "₲",    "es-PY"),
  C("PE", "Peru",                  AMERICAS, "ES", "Español",   "PEN", "S/",   "es-PE"),
  C("PR", "Puerto Rico",           AMERICAS, "ES", "Español",   "USD", "$",    "es-PR"),
  C("BL", "Saint Barthélemy",      AMERICAS, "FR", "Français",  "EUR", "€",    "fr-BL"),
  C("KN", "Saint Kitts & Nevis",   AMERICAS, "EN", "English",   "XCD", "$",    "en-KN"),
  C("LC", "Saint Lucia",           AMERICAS, "EN", "English",   "XCD", "$",    "en-LC"),
  C("MF", "Saint Martin",          AMERICAS, "FR", "Français",  "EUR", "€",    "fr-MF"),
  C("PM", "Saint Pierre & Miquelon", AMERICAS, "FR", "Français","EUR", "€",    "fr-PM"),
  C("VC", "Saint Vincent",         AMERICAS, "EN", "English",   "XCD", "$",    "en-VC"),
  C("SX", "Sint Maarten",          AMERICAS, "NL", "Nederlands","ANG", "ƒ",    "nl-SX"),
  C("SR", "Suriname",              AMERICAS, "NL", "Nederlands","SRD", "$",    "nl-SR"),
  C("TT", "Trinidad & Tobago",     AMERICAS, "EN", "English",   "TTD", "$",    "en-TT"),
  C("TC", "Turks & Caicos",        AMERICAS, "EN", "English",   "USD", "$",    "en-TC"),
  C("US", "United States",         AMERICAS, "EN", "English",   "USD", "$",    "en-US"),
  C("UY", "Uruguay",               AMERICAS, "ES", "Español",   "UYU", "$",    "es-UY"),
  C("VE", "Venezuela",             AMERICAS, "ES", "Español",   "VES", "Bs.S", "es-VE"),
  C("VI", "U.S. Virgin Islands",   AMERICAS, "EN", "English",   "USD", "$",    "en-VI"),

  // ─── ASIA & PACIFIC ────────────────────────────────────────────────────
  C("AF", "Afghanistan",           ASIA, "PS", "پښتو",          "AFN", "؋",    "ps-AF"),
  C("AS", "American Samoa",        ASIA, "EN", "English",       "USD", "$",    "en-AS"),
  C("AU", "Australia",             ASIA, "EN", "English",       "AUD", "A$",   "en-AU"),
  C("BD", "Bangladesh",            ASIA, "BN", "বাংলা",          "BDT", "৳",    "bn-BD"),
  C("BT", "Bhutan",                ASIA, "DZ", "རྫོང་ཁ",          "BTN", "Nu",   "dz-BT"),
  C("BN", "Brunei Darussalam",     ASIA, "MS", "Bahasa Melayu", "BND", "B$",   "ms-BN"),
  C("KH", "Cambodia",              ASIA, "KM", "ភាសាខ្មែរ",       "KHR", "៛",    "km-KH"),
  C("CN", "China",                 ASIA, "ZH", "中文",            "CNY", "¥",    "zh-CN"),
  C("CX", "Christmas Island",      ASIA, "EN", "English",       "AUD", "A$",   "en-CX"),
  C("CC", "Cocos (Keeling) Islands", ASIA, "EN", "English",     "AUD", "A$",   "en-CC"),
  C("CK", "Cook Islands",          ASIA, "EN", "English",       "NZD", "NZ$",  "en-CK"),
  C("FJ", "Fiji",                  ASIA, "EN", "English",       "FJD", "FJ$",  "en-FJ"),
  C("PF", "French Polynesia",      ASIA, "FR", "Français",      "XPF", "₣",    "fr-PF"),
  C("TF", "French Southern Territories", ASIA, "FR", "Français","EUR", "€",    "fr-TF"),
  C("GU", "Guam",                  ASIA, "EN", "English",       "USD", "$",    "en-GU"),
  C("HK", "Hong Kong",             ASIA, "ZH", "中文",            "HKD", "HK$",  "zh-HK"),
  C("IN", "India",                 ASIA, "HI", "हिन्दी",           "INR", "₹",    "hi-IN"),
  C("ID", "Indonesia",             ASIA, "ID", "Bahasa Indonesia","IDR","Rp",   "id-ID"),
  C("JP", "Japan",                 ASIA, "JA", "日本語",          "JPY", "¥",    "ja-JP"),
  C("KZ", "Kazakhstan",            ASIA, "KK", "Қазақша",       "KZT", "₸",    "kk-KZ"),
  C("KI", "Kiribati",              ASIA, "EN", "English",       "AUD", "A$",   "en-KI"),
  C("KP", "Korea (North)",         ASIA, "KO", "한국어",          "KPW", "₩",    "ko-KP"),
  C("KR", "Korea (South)",         ASIA, "KO", "한국어",          "KRW", "₩",    "ko-KR"),
  C("KG", "Kyrgyzstan",            ASIA, "KY", "Кыргызча",      "KGS", "лв",   "ky-KG"),
  C("LA", "Laos",                  ASIA, "LO", "ລາວ",            "LAK", "₭",    "lo-LA"),
  C("MO", "Macau",                 ASIA, "ZH", "中文",            "MOP", "MOP$", "zh-MO"),
  C("MY", "Malaysia",              ASIA, "MS", "Bahasa Melayu", "MYR", "RM",   "ms-MY"),
  C("MV", "Maldives",              ASIA, "DV", "ދިވެހި",          "MVR", "Rf",   "dv-MV"),
  C("MH", "Marshall Islands",      ASIA, "EN", "English",       "USD", "$",    "en-MH"),
  C("FM", "Micronesia",            ASIA, "EN", "English",       "USD", "$",    "en-FM"),
  C("MN", "Mongolia",              ASIA, "MN", "Монгол",         "MNT", "₮",    "mn-MN"),
  C("MM", "Myanmar",               ASIA, "MY", "မြန်မာ",          "MMK", "K",    "my-MM"),
  C("NR", "Nauru",                 ASIA, "EN", "English",       "AUD", "A$",   "en-NR"),
  C("NP", "Nepal",                 ASIA, "NE", "नेपाली",          "NPR", "₨",    "ne-NP"),
  C("NC", "New Caledonia",         ASIA, "FR", "Français",      "XPF", "₣",    "fr-NC"),
  C("NZ", "New Zealand",           ASIA, "EN", "English",       "NZD", "NZ$",  "en-NZ"),
  C("NU", "Niue",                  ASIA, "EN", "English",       "NZD", "NZ$",  "en-NU"),
  C("NF", "Norfolk Island",        ASIA, "EN", "English",       "AUD", "A$",   "en-NF"),
  C("MP", "Northern Mariana Is.",  ASIA, "EN", "English",       "USD", "$",    "en-MP"),
  C("PK", "Pakistan",              ASIA, "UR", "اردو",          "PKR", "₨",    "ur-PK"),
  C("PW", "Palau",                 ASIA, "EN", "English",       "USD", "$",    "en-PW"),
  C("PG", "Papua New Guinea",      ASIA, "EN", "English",       "PGK", "K",    "en-PG"),
  C("PH", "Philippines",           ASIA, "TL", "Filipino",      "PHP", "₱",    "tl-PH"),
  C("PN", "Pitcairn Islands",      ASIA, "EN", "English",       "NZD", "NZ$",  "en-PN"),
  C("WS", "Samoa",                 ASIA, "EN", "English",       "WST", "T",    "en-WS"),
  C("SG", "Singapore",             ASIA, "EN", "English",       "SGD", "S$",   "en-SG"),
  C("SB", "Solomon Islands",       ASIA, "EN", "English",       "SBD", "SI$",  "en-SB"),
  C("LK", "Sri Lanka",             ASIA, "SI", "සිංහල",          "LKR", "₨",    "si-LK"),
  C("TW", "Taiwan",                ASIA, "ZH", "中文",            "TWD", "NT$",  "zh-TW"),
  C("TJ", "Tajikistan",            ASIA, "TG", "Тоҷикӣ",         "TJS", "SM",   "tg-TJ"),
  C("TH", "Thailand",              ASIA, "TH", "ไทย",            "THB", "฿",    "th-TH"),
  C("TL", "Timor-Leste",           ASIA, "PT", "Português",     "USD", "$",    "pt-TL"),
  C("TK", "Tokelau",               ASIA, "EN", "English",       "NZD", "NZ$",  "en-TK"),
  C("TO", "Tonga",                 ASIA, "EN", "English",       "TOP", "T$",   "en-TO"),
  C("TM", "Turkmenistan",          ASIA, "TK", "Türkmen",       "TMT", "m",    "tk-TM"),
  C("TV", "Tuvalu",                ASIA, "EN", "English",       "AUD", "A$",   "en-TV"),
  C("UZ", "Uzbekistan",            ASIA, "UZ", "Oʻzbekcha",     "UZS", "лв",   "uz-UZ"),
  C("VU", "Vanuatu",               ASIA, "EN", "English",       "VUV", "VT",   "en-VU"),
  C("VN", "Vietnam",               ASIA, "VI", "Tiếng Việt",    "VND", "₫",    "vi-VN"),
  C("WF", "Wallis & Futuna",       ASIA, "FR", "Français",      "XPF", "₣",    "fr-WF"),

  // ─── EUROPE ────────────────────────────────────────────────────────────
  C("AX", "Åland Islands",         EUROPE, "SV", "Svenska",     "EUR", "€",    "sv-AX"),
  C("AL", "Albania",               EUROPE, "SQ", "Shqip",       "ALL", "L",    "sq-AL"),
  C("AD", "Andorra",               EUROPE, "CA", "Català",      "EUR", "€",    "ca-AD"),
  C("AM", "Armenia",               EUROPE, "HY", "Հայերեն",      "AMD", "֏",    "hy-AM"),
  C("AT", "Austria",               EUROPE, "DE", "Deutsch",     "EUR", "€",    "de-AT"),
  C("AZ", "Azerbaijan",            EUROPE, "AZ", "Azərbaycanca","AZN", "₼",    "az-AZ"),
  C("BY", "Belarus",               EUROPE, "BE", "Беларуская",  "BYN", "Br",   "be-BY"),
  C("BE", "Belgium",               EUROPE, "NL", "Nederlands",  "EUR", "€",    "nl-BE"),
  C("BA", "Bosnia & Herzegovina",  EUROPE, "BS", "Bosanski",    "BAM", "KM",   "bs-BA"),
  C("BG", "Bulgaria",              EUROPE, "BG", "Български",   "BGN", "лв",   "bg-BG"),
  C("HR", "Croatia",               EUROPE, "HR", "Hrvatski",    "EUR", "€",    "hr-HR"),
  C("CY", "Cyprus",                EUROPE, "EL", "Ελληνικά",    "EUR", "€",    "el-CY"),
  C("CZ", "Czechia",               EUROPE, "CS", "Čeština",     "CZK", "Kč",   "cs-CZ"),
  C("DK", "Denmark",               EUROPE, "DA", "Dansk",       "DKK", "kr",   "da-DK"),
  C("EE", "Estonia",               EUROPE, "ET", "Eesti",       "EUR", "€",    "et-EE"),
  C("FO", "Faroe Islands",         EUROPE, "FO", "Føroyskt",    "DKK", "kr",   "fo-FO"),
  C("FI", "Finland",               EUROPE, "FI", "Suomi",       "EUR", "€",    "fi-FI"),
  C("FR", "France",                EUROPE, "FR", "Français",    "EUR", "€",    "fr-FR"),
  C("GE", "Georgia",               EUROPE, "KA", "ქართული",     "GEL", "₾",    "ka-GE"),
  C("DE", "Germany",               EUROPE, "DE", "Deutsch",     "EUR", "€",    "de-DE"),
  C("GI", "Gibraltar",             EUROPE, "EN", "English",     "GIP", "£",    "en-GI"),
  C("GR", "Greece",                EUROPE, "EL", "Ελληνικά",    "EUR", "€",    "el-GR"),
  C("GL", "Greenland",             EUROPE, "DA", "Dansk",       "DKK", "kr",   "da-GL"),
  C("GG", "Guernsey",              EUROPE, "EN", "English",     "GBP", "£",    "en-GG"),
  C("HU", "Hungary",               EUROPE, "HU", "Magyar",      "HUF", "Ft",   "hu-HU"),
  C("IS", "Iceland",               EUROPE, "IS", "Íslenska",    "ISK", "kr",   "is-IS"),
  C("IE", "Ireland",               EUROPE, "EN", "English",     "EUR", "€",    "en-IE"),
  C("IM", "Isle of Man",           EUROPE, "EN", "English",     "GBP", "£",    "en-IM"),
  C("IT", "Italy",                 EUROPE, "IT", "Italiano",    "EUR", "€",    "it-IT"),
  C("JE", "Jersey",                EUROPE, "EN", "English",     "GBP", "£",    "en-JE"),
  C("XK", "Kosovo",                EUROPE, "SQ", "Shqip",       "EUR", "€",    "sq-XK"),
  C("LV", "Latvia",                EUROPE, "LV", "Latviešu",    "EUR", "€",    "lv-LV"),
  C("LI", "Liechtenstein",         EUROPE, "DE", "Deutsch",     "CHF", "CHF",  "de-LI"),
  C("LT", "Lithuania",             EUROPE, "LT", "Lietuvių",    "EUR", "€",    "lt-LT"),
  C("LU", "Luxembourg",            EUROPE, "FR", "Français",    "EUR", "€",    "fr-LU"),
  C("MT", "Malta",                 EUROPE, "MT", "Malti",       "EUR", "€",    "mt-MT"),
  C("MD", "Moldova",               EUROPE, "RO", "Română",      "MDL", "L",    "ro-MD"),
  C("MC", "Monaco",                EUROPE, "FR", "Français",    "EUR", "€",    "fr-MC"),
  C("ME", "Montenegro",            EUROPE, "SR", "Crnogorski",  "EUR", "€",    "sr-ME"),
  C("NL", "Netherlands",           EUROPE, "NL", "Nederlands",  "EUR", "€",    "nl-NL"),
  C("MK", "North Macedonia",       EUROPE, "MK", "Македонски",  "MKD", "ден",  "mk-MK"),
  C("NO", "Norway",                EUROPE, "NO", "Norsk",       "NOK", "kr",   "no-NO"),
  C("PL", "Poland",                EUROPE, "PL", "Polski",      "PLN", "zł",   "pl-PL"),
  C("PT", "Portugal",              EUROPE, "PT", "Português",   "EUR", "€",    "pt-PT"),
  C("RO", "Romania",               EUROPE, "RO", "Română",      "RON", "lei",  "ro-RO"),
  C("RU", "Russia",                EUROPE, "RU", "Русский",     "RUB", "₽",    "ru-RU"),
  C("SM", "San Marino",            EUROPE, "IT", "Italiano",    "EUR", "€",    "it-SM"),
  C("RS", "Serbia",                EUROPE, "SR", "Српски",      "RSD", "din",  "sr-RS"),
  C("SK", "Slovakia",              EUROPE, "SK", "Slovenčina",  "EUR", "€",    "sk-SK"),
  C("SI", "Slovenia",              EUROPE, "SL", "Slovenščina", "EUR", "€",    "sl-SI"),
  C("ES", "Spain",                 EUROPE, "ES", "Español",     "EUR", "€",    "es-ES"),
  C("SJ", "Svalbard & Jan Mayen",  EUROPE, "NO", "Norsk",       "NOK", "kr",   "no-SJ"),
  C("SE", "Sweden",                EUROPE, "SV", "Svenska",     "SEK", "kr",   "sv-SE"),
  C("CH", "Switzerland",           EUROPE, "DE", "Deutsch",     "CHF", "CHF",  "de-CH"),
  C("UA", "Ukraine",               EUROPE, "UK", "Українська",  "UAH", "₴",    "uk-UA"),
  C("GB", "United Kingdom",        EUROPE, "EN", "English",     "GBP", "£",    "en-GB"),
  C("VA", "Vatican City",          EUROPE, "IT", "Italiano",    "EUR", "€",    "it-VA"),

  // ─── MIDDLE EAST ───────────────────────────────────────────────────────
  C("BH", "Bahrain",               MIDDLE_EAST, "AR", "العربية", "BHD", "BD",  "ar-BH"),
  C("IR", "Iran",                  MIDDLE_EAST, "FA", "فارسی",   "IRR", "﷼",   "fa-IR"),
  C("IQ", "Iraq",                  MIDDLE_EAST, "AR", "العربية", "IQD", "ID",  "ar-IQ"),
  C("IL", "Israel",                MIDDLE_EAST, "HE", "עברית",   "ILS", "₪",   "he-IL"),
  C("JO", "Jordan",                MIDDLE_EAST, "AR", "العربية", "JOD", "JD",  "ar-JO"),
  C("KW", "Kuwait",                MIDDLE_EAST, "AR", "العربية", "KWD", "KD",  "ar-KW"),
  C("LB", "Lebanon",               MIDDLE_EAST, "AR", "العربية", "LBP", "L£",  "ar-LB"),
  C("OM", "Oman",                  MIDDLE_EAST, "AR", "العربية", "OMR", "OMR", "ar-OM"),
  C("PS", "Palestine",             MIDDLE_EAST, "AR", "العربية", "ILS", "₪",   "ar-PS"),
  C("QA", "Qatar",                 MIDDLE_EAST, "AR", "العربية", "QAR", "QR",  "ar-QA"),
  C("SA", "Saudi Arabia",          MIDDLE_EAST, "AR", "العربية", "SAR", "SR",  "ar-SA"),
  C("SY", "Syria",                 MIDDLE_EAST, "AR", "العربية", "SYP", "S£",  "ar-SY"),
  C("TR", "Türkiye",               MIDDLE_EAST, "TR", "Türkçe",  "TRY", "₺",   "tr-TR"),
  C("AE", "United Arab Emirates",  MIDDLE_EAST, "AR", "العربية", "AED", "AED", "ar-AE"),
  C("YE", "Yemen",                 MIDDLE_EAST, "AR", "العربية", "YER", "YR",  "ar-YE"),
];

export const REGIONS = [AFRICA, AMERICAS, ASIA, EUROPE, MIDDLE_EAST];

/**
 * Default country for first-time visitors. PG = Papua New Guinea, the
 * pitch demo's home market — preserves existing PGK / "K" labelling for
 * users who never touch the picker.
 */
export const DEFAULT_COUNTRY_CODE = "PG";

export const findCountry = (code) =>
  COUNTRIES.find((c) => c.code === code) ||
  COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY_CODE);

/**
 * Convert a 2-letter ISO country code to a Unicode flag emoji using
 * Regional Indicator Symbols. e.g. "DE" -> 🇩🇪. Returns the globe glyph for
 * non-letter codes (defensive fallback for unknown codes like "XK").
 */
export const flagFor = (code) => {
  if (!code || code.length !== 2) return "🌐";
  const A = 0x1f1e6;
  const upper = code.toUpperCase();
  const cp1 = A + (upper.charCodeAt(0) - 65);
  const cp2 = A + (upper.charCodeAt(1) - 65);
  if (cp1 < A || cp2 < A) return "🌐";
  return String.fromCodePoint(cp1) + String.fromCodePoint(cp2);
};
