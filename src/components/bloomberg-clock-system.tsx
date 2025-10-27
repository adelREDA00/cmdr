'use client'
import { useState, useEffect, useRef } from 'react'
import { Clock, Globe, Plus, X, Search, Minus } from 'lucide-react'
import { useIsMobile } from '../hooks/use-mobile'
import { useClock } from '../contexts/clock-state'

interface TimezoneInfo {
  name: string
  offset: number
  display: string
  abbreviation: string
  city: string
  country?: string
}

// Major cities with their timezone information
const MAJOR_CITIES: TimezoneInfo[] = [
  { name: 'America/New_York', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'New York', country: 'USA' },
  { name: 'America/Los_Angeles', offset: -8, display: 'Pacific Time', abbreviation: 'PST', city: 'Los Angeles', country: 'USA' },
  { name: 'America/Chicago', offset: -6, display: 'Central Time', abbreviation: 'CST', city: 'Chicago', country: 'USA' },
  { name: 'Europe/London', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'London', country: 'UK' },
  { name: 'Europe/Paris', offset: 2, display: 'Central European Summer Time', abbreviation: 'CEST', city: 'Paris', country: 'France' },
  { name: 'Europe/Berlin', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Berlin', country: 'Germany' },
  { name: 'Asia/Tokyo', offset: 9, display: 'Japan Standard Time', abbreviation: 'JST', city: 'Tokyo', country: 'Japan' },
  { name: 'Asia/Shanghai', offset: 8, display: 'China Standard Time', abbreviation: 'CST', city: 'Shanghai', country: 'China' },
  { name: 'Asia/Dubai', offset: 4, display: 'Gulf Standard Time', abbreviation: 'GST', city: 'Dubai', country: 'UAE' },
  { name: 'Asia/Mumbai', offset: 5.5, display: 'India Standard Time', abbreviation: 'IST', city: 'Mumbai', country: 'India' },
  { name: 'Australia/Sydney', offset: 10, display: 'Australian Eastern Time', abbreviation: 'AEST', city: 'Sydney', country: 'Australia' },
  { name: 'America/Sao_Paulo', offset: -3, display: 'Brasilia Time', abbreviation: 'BRT', city: 'São Paulo', country: 'Brazil' },
  { name: 'America/Toronto', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Toronto', country: 'Canada' },
  { name: 'Europe/Moscow', offset: 3, display: 'Moscow Time', abbreviation: 'MSK', city: 'Moscow', country: 'Russia' },
  { name: 'Asia/Seoul', offset: 9, display: 'Korea Standard Time', abbreviation: 'KST', city: 'Seoul', country: 'South Korea' },
  { name: 'Asia/Singapore', offset: 8, display: 'Singapore Time', abbreviation: 'SGT', city: 'Singapore', country: 'Singapore' },
  { name: 'America/Mexico_City', offset: -6, display: 'Central Time', abbreviation: 'CST', city: 'Mexico City', country: 'Mexico' },
  { name: 'Africa/Cairo', offset: 2, display: 'Eastern European Time', abbreviation: 'EET', city: 'Cairo', country: 'Egypt' },
  { name: 'America/Buenos_Aires', offset: -3, display: 'Argentina Time', abbreviation: 'ART', city: 'Buenos Aires', country: 'Argentina' },
  { name: 'Africa/Johannesburg', offset: 2, display: 'South Africa Time', abbreviation: 'SAST', city: 'Johannesburg', country: 'South Africa' }
]

// Extended comprehensive list for search functionality
const ALL_CITIES: TimezoneInfo[] = [
  ...MAJOR_CITIES,
  // North America
  { name: 'America/Denver', offset: -7, display: 'Mountain Time', abbreviation: 'MST', city: 'Denver', country: 'USA' },
  { name: 'America/Phoenix', offset: -7, display: 'Mountain Time', abbreviation: 'MST', city: 'Phoenix', country: 'USA' },
  { name: 'America/Detroit', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Detroit', country: 'USA' },
  { name: 'America/Miami', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Miami', country: 'USA' },
  { name: 'America/Seattle', offset: -8, display: 'Pacific Time', abbreviation: 'PST', city: 'Seattle', country: 'USA' },
  { name: 'America/Atlanta', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Atlanta', country: 'USA' },
  { name: 'America/Boston', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Boston', country: 'USA' },
  { name: 'America/Dallas', offset: -6, display: 'Central Time', abbreviation: 'CST', city: 'Dallas', country: 'USA' },
  { name: 'America/Houston', offset: -6, display: 'Central Time', abbreviation: 'CST', city: 'Houston', country: 'USA' },
  { name: 'America/Las_Vegas', offset: -8, display: 'Pacific Time', abbreviation: 'PST', city: 'Las Vegas', country: 'USA' },
  { name: 'America/Portland', offset: -8, display: 'Pacific Time', abbreviation: 'PST', city: 'Portland', country: 'USA' },
  { name: 'America/San_Francisco', offset: -8, display: 'Pacific Time', abbreviation: 'PST', city: 'San Francisco', country: 'USA' },
  { name: 'America/Washington', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Washington DC', country: 'USA' },
  { name: 'America/Vancouver', offset: -8, display: 'Pacific Time', abbreviation: 'PST', city: 'Vancouver', country: 'Canada' },
  { name: 'America/Montreal', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Montreal', country: 'Canada' },
  { name: 'America/Calgary', offset: -7, display: 'Mountain Time', abbreviation: 'MST', city: 'Calgary', country: 'Canada' },
  { name: 'America/Winnipeg', offset: -6, display: 'Central Time', abbreviation: 'CST', city: 'Winnipeg', country: 'Canada' },
  { name: 'America/Halifax', offset: -4, display: 'Atlantic Time', abbreviation: 'AST', city: 'Halifax', country: 'Canada' },
  { name: 'America/St_Johns', offset: -3.5, display: 'Newfoundland Time', abbreviation: 'NST', city: 'St. John\'s', country: 'Canada' },
  
  // Europe
  { name: 'Europe/Rome', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Rome', country: 'Italy' },
  { name: 'Europe/Madrid', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Madrid', country: 'Spain' },
  { name: 'Europe/Amsterdam', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Amsterdam', country: 'Netherlands' },
  { name: 'Europe/Zurich', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Zurich', country: 'Switzerland' },
  { name: 'Europe/Vienna', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Vienna', country: 'Austria' },
  { name: 'Europe/Brussels', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Brussels', country: 'Belgium' },
  { name: 'Europe/Copenhagen', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Copenhagen', country: 'Denmark' },
  { name: 'Europe/Helsinki', offset: 2, display: 'Eastern European Time', abbreviation: 'EET', city: 'Helsinki', country: 'Finland' },
  { name: 'Europe/Stockholm', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Stockholm', country: 'Sweden' },
  { name: 'Europe/Oslo', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Oslo', country: 'Norway' },
  { name: 'Europe/Dublin', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'Dublin', country: 'Ireland' },
  { name: 'Europe/Lisbon', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'Lisbon', country: 'Portugal' },
  { name: 'Europe/Prague', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Prague', country: 'Czech Republic' },
  { name: 'Europe/Warsaw', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Warsaw', country: 'Poland' },
  { name: 'Europe/Budapest', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Budapest', country: 'Hungary' },
  { name: 'Europe/Bucharest', offset: 2, display: 'Eastern European Time', abbreviation: 'EET', city: 'Bucharest', country: 'Romania' },
  { name: 'Europe/Sofia', offset: 2, display: 'Eastern European Time', abbreviation: 'EET', city: 'Sofia', country: 'Bulgaria' },
  { name: 'Europe/Zagreb', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Zagreb', country: 'Croatia' },
  { name: 'Europe/Belgrade', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Belgrade', country: 'Serbia' },
  { name: 'Europe/Kiev', offset: 2, display: 'Eastern European Time', abbreviation: 'EET', city: 'Kiev', country: 'Ukraine' },
  { name: 'Europe/Istanbul', offset: 3, display: 'Turkey Time', abbreviation: 'TRT', city: 'Istanbul', country: 'Turkey' },
  { name: 'Europe/Athens', offset: 2, display: 'Eastern European Time', abbreviation: 'EET', city: 'Athens', country: 'Greece' },
  
  // Asia
  { name: 'Asia/Hong_Kong', offset: 8, display: 'Hong Kong Time', abbreviation: 'HKT', city: 'Hong Kong', country: 'Hong Kong' },
  { name: 'Asia/Bangkok', offset: 7, display: 'Indochina Time', abbreviation: 'ICT', city: 'Bangkok', country: 'Thailand' },
  { name: 'Asia/Jakarta', offset: 7, display: 'Western Indonesia Time', abbreviation: 'WIB', city: 'Jakarta', country: 'Indonesia' },
  { name: 'Asia/Kolkata', offset: 5.5, display: 'India Standard Time', abbreviation: 'IST', city: 'Kolkata', country: 'India' },
  { name: 'Asia/Delhi', offset: 5.5, display: 'India Standard Time', abbreviation: 'IST', city: 'Delhi', country: 'India' },
  { name: 'Asia/Bangalore', offset: 5.5, display: 'India Standard Time', abbreviation: 'IST', city: 'Bangalore', country: 'India' },
  { name: 'Asia/Chennai', offset: 5.5, display: 'India Standard Time', abbreviation: 'IST', city: 'Chennai', country: 'India' },
  { name: 'Asia/Hyderabad', offset: 5.5, display: 'India Standard Time', abbreviation: 'IST', city: 'Hyderabad', country: 'India' },
  { name: 'Asia/Pune', offset: 5.5, display: 'India Standard Time', abbreviation: 'IST', city: 'Pune', country: 'India' },
  { name: 'Asia/Ahmedabad', offset: 5.5, display: 'India Standard Time', abbreviation: 'IST', city: 'Ahmedabad', country: 'India' },
  { name: 'Asia/Karachi', offset: 5, display: 'Pakistan Standard Time', abbreviation: 'PKT', city: 'Karachi', country: 'Pakistan' },
  { name: 'Asia/Lahore', offset: 5, display: 'Pakistan Standard Time', abbreviation: 'PKT', city: 'Lahore', country: 'Pakistan' },
  { name: 'Asia/Dhaka', offset: 6, display: 'Bangladesh Standard Time', abbreviation: 'BST', city: 'Dhaka', country: 'Bangladesh' },
  { name: 'Asia/Kathmandu', offset: 5.75, display: 'Nepal Time', abbreviation: 'NPT', city: 'Kathmandu', country: 'Nepal' },
  { name: 'Asia/Colombo', offset: 5.5, display: 'Sri Lanka Time', abbreviation: 'SLST', city: 'Colombo', country: 'Sri Lanka' },
  { name: 'Asia/Kuala_Lumpur', offset: 8, display: 'Malaysia Time', abbreviation: 'MYT', city: 'Kuala Lumpur', country: 'Malaysia' },
  { name: 'Asia/Manila', offset: 8, display: 'Philippine Time', abbreviation: 'PHT', city: 'Manila', country: 'Philippines' },
  { name: 'Asia/Ho_Chi_Minh', offset: 7, display: 'Indochina Time', abbreviation: 'ICT', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { name: 'Asia/Hanoi', offset: 7, display: 'Indochina Time', abbreviation: 'ICT', city: 'Hanoi', country: 'Vietnam' },
  { name: 'Asia/Yangon', offset: 6.5, display: 'Myanmar Time', abbreviation: 'MMT', city: 'Yangon', country: 'Myanmar' },
  { name: 'Asia/Phnom_Penh', offset: 7, display: 'Indochina Time', abbreviation: 'ICT', city: 'Phnom Penh', country: 'Cambodia' },
  { name: 'Asia/Vientiane', offset: 7, display: 'Indochina Time', abbreviation: 'ICT', city: 'Vientiane', country: 'Laos' },
  { name: 'Asia/Taipei', offset: 8, display: 'Taiwan Time', abbreviation: 'CST', city: 'Taipei', country: 'Taiwan' },
  { name: 'Asia/Ulaanbaatar', offset: 8, display: 'Ulaanbaatar Time', abbreviation: 'ULAT', city: 'Ulaanbaatar', country: 'Mongolia' },
  { name: 'Asia/Almaty', offset: 6, display: 'Almaty Time', abbreviation: 'ALMT', city: 'Almaty', country: 'Kazakhstan' },
  { name: 'Asia/Tashkent', offset: 5, display: 'Uzbekistan Time', abbreviation: 'UZT', city: 'Tashkent', country: 'Uzbekistan' },
  { name: 'Asia/Bishkek', offset: 6, display: 'Kyrgyzstan Time', abbreviation: 'KGT', city: 'Bishkek', country: 'Kyrgyzstan' },
  { name: 'Asia/Dushanbe', offset: 5, display: 'Tajikistan Time', abbreviation: 'TJT', city: 'Dushanbe', country: 'Tajikistan' },
  { name: 'Asia/Ashgabat', offset: 5, display: 'Turkmenistan Time', abbreviation: 'TMT', city: 'Ashgabat', country: 'Turkmenistan' },
  
  // Middle East & Central Asia
  { name: 'Asia/Tehran', offset: 3.5, display: 'Iran Standard Time', abbreviation: 'IRST', city: 'Tehran', country: 'Iran' },
  { name: 'Asia/Baghdad', offset: 3, display: 'Arabia Standard Time', abbreviation: 'AST', city: 'Baghdad', country: 'Iraq' },
  { name: 'Asia/Kuwait', offset: 3, display: 'Arabia Standard Time', abbreviation: 'AST', city: 'Kuwait City', country: 'Kuwait' },
  { name: 'Asia/Riyadh', offset: 3, display: 'Arabia Standard Time', abbreviation: 'AST', city: 'Riyadh', country: 'Saudi Arabia' },
  { name: 'Asia/Doha', offset: 3, display: 'Arabia Standard Time', abbreviation: 'AST', city: 'Doha', country: 'Qatar' },
  { name: 'Asia/Bahrain', offset: 3, display: 'Arabia Standard Time', abbreviation: 'AST', city: 'Manama', country: 'Bahrain' },
  { name: 'Asia/Muscat', offset: 4, display: 'Gulf Standard Time', abbreviation: 'GST', city: 'Muscat', country: 'Oman' },
  { name: 'Asia/Kabul', offset: 4.5, display: 'Afghanistan Time', abbreviation: 'AFT', city: 'Kabul', country: 'Afghanistan' },
  { name: 'Asia/Karachi', offset: 5, display: 'Pakistan Standard Time', abbreviation: 'PKT', city: 'Islamabad', country: 'Pakistan' },
  
  // Africa
  { name: 'Africa/Lagos', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Lagos', country: 'Nigeria' },
  { name: 'Africa/Casablanca', offset: 0, display: 'Western European Time', abbreviation: 'WET', city: 'Casablanca', country: 'Morocco' },
  { name: 'Africa/Algiers', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Algiers', country: 'Algeria' },
  { name: 'Africa/Tunis', offset: 1, display: 'Central European Time', abbreviation: 'CET', city: 'Tunis', country: 'Tunisia' },
  { name: 'Africa/Tripoli', offset: 2, display: 'Eastern European Time', abbreviation: 'EET', city: 'Tripoli', country: 'Libya' },
  { name: 'Africa/Khartoum', offset: 2, display: 'Central Africa Time', abbreviation: 'CAT', city: 'Khartoum', country: 'Sudan' },
  { name: 'Africa/Addis_Ababa', offset: 3, display: 'East Africa Time', abbreviation: 'EAT', city: 'Addis Ababa', country: 'Ethiopia' },
  { name: 'Africa/Nairobi', offset: 3, display: 'East Africa Time', abbreviation: 'EAT', city: 'Nairobi', country: 'Kenya' },
  { name: 'Africa/Kampala', offset: 3, display: 'East Africa Time', abbreviation: 'EAT', city: 'Kampala', country: 'Uganda' },
  { name: 'Africa/Dar_es_Salaam', offset: 3, display: 'East Africa Time', abbreviation: 'EAT', city: 'Dar es Salaam', country: 'Tanzania' },
  { name: 'Africa/Kigali', offset: 2, display: 'Central Africa Time', abbreviation: 'CAT', city: 'Kigali', country: 'Rwanda' },
  { name: 'Africa/Bujumbura', offset: 2, display: 'Central Africa Time', abbreviation: 'CAT', city: 'Bujumbura', country: 'Burundi' },
  { name: 'Africa/Kinshasa', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Kinshasa', country: 'DR Congo' },
  { name: 'Africa/Lubumbashi', offset: 2, display: 'Central Africa Time', abbreviation: 'CAT', city: 'Lubumbashi', country: 'DR Congo' },
  { name: 'Africa/Brazzaville', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Brazzaville', country: 'Congo' },
  { name: 'Africa/Luanda', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Luanda', country: 'Angola' },
  { name: 'Africa/Lusaka', offset: 2, display: 'Central Africa Time', abbreviation: 'CAT', city: 'Lusaka', country: 'Zambia' },
  { name: 'Africa/Harare', offset: 2, display: 'Central Africa Time', abbreviation: 'CAT', city: 'Harare', country: 'Zimbabwe' },
  { name: 'Africa/Gaborone', offset: 2, display: 'Central Africa Time', abbreviation: 'CAT', city: 'Gaborone', country: 'Botswana' },
  { name: 'Africa/Windhoek', offset: 2, display: 'Central Africa Time', abbreviation: 'CAT', city: 'Windhoek', country: 'Namibia' },
  { name: 'Africa/Maputo', offset: 2, display: 'Central Africa Time', abbreviation: 'CAT', city: 'Maputo', country: 'Mozambique' },
  { name: 'Africa/Antananarivo', offset: 3, display: 'East Africa Time', abbreviation: 'EAT', city: 'Antananarivo', country: 'Madagascar' },
  { name: 'Africa/Port_Louis', offset: 4, display: 'Mauritius Time', abbreviation: 'MUT', city: 'Port Louis', country: 'Mauritius' },
  { name: 'Africa/Dakar', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'Dakar', country: 'Senegal' },
  { name: 'Africa/Bamako', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'Bamako', country: 'Mali' },
  { name: 'Africa/Ouagadougou', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'Ouagadougou', country: 'Burkina Faso' },
  { name: 'Africa/Abidjan', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'Abidjan', country: 'Ivory Coast' },
  { name: 'Africa/Accra', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'Accra', country: 'Ghana' },
  { name: 'Africa/Lome', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'Lome', country: 'Togo' },
  { name: 'Africa/Porto_Novo', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Porto-Novo', country: 'Benin' },
  { name: 'Africa/Niamey', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Niamey', country: 'Niger' },
  { name: 'Africa/Ndjamena', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'N\'Djamena', country: 'Chad' },
  { name: 'Africa/Bangui', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Bangui', country: 'Central African Republic' },
  { name: 'Africa/Douala', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Douala', country: 'Cameroon' },
  { name: 'Africa/Libreville', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Libreville', country: 'Gabon' },
  { name: 'Africa/Malabo', offset: 1, display: 'West Africa Time', abbreviation: 'WAT', city: 'Malabo', country: 'Equatorial Guinea' },
  { name: 'Africa/Sao_Tome', offset: 0, display: 'Greenwich Mean Time', abbreviation: 'GMT', city: 'Sao Tome', country: 'Sao Tome and Principe' },
  
  // South America
  { name: 'America/Lima', offset: -5, display: 'Peru Time', abbreviation: 'PET', city: 'Lima', country: 'Peru' },
  { name: 'America/Bogota', offset: -5, display: 'Colombia Time', abbreviation: 'COT', city: 'Bogota', country: 'Colombia' },
  { name: 'America/Caracas', offset: -4, display: 'Venezuela Time', abbreviation: 'VET', city: 'Caracas', country: 'Venezuela' },
  { name: 'America/Quito', offset: -5, display: 'Ecuador Time', abbreviation: 'ECT', city: 'Quito', country: 'Ecuador' },
  { name: 'America/Guayaquil', offset: -5, display: 'Ecuador Time', abbreviation: 'ECT', city: 'Guayaquil', country: 'Ecuador' },
  { name: 'America/La_Paz', offset: -4, display: 'Bolivia Time', abbreviation: 'BOT', city: 'La Paz', country: 'Bolivia' },
  { name: 'America/Sucre', offset: -4, display: 'Bolivia Time', abbreviation: 'BOT', city: 'Sucre', country: 'Bolivia' },
  { name: 'America/Asuncion', offset: -3, display: 'Paraguay Time', abbreviation: 'PYT', city: 'Asuncion', country: 'Paraguay' },
  { name: 'America/Montevideo', offset: -3, display: 'Uruguay Time', abbreviation: 'UYT', city: 'Montevideo', country: 'Uruguay' },
  { name: 'America/Santiago', offset: -3, display: 'Chile Time', abbreviation: 'CLT', city: 'Santiago', country: 'Chile' },
  { name: 'America/Valparaiso', offset: -3, display: 'Chile Time', abbreviation: 'CLT', city: 'Valparaiso', country: 'Chile' },
  { name: 'America/Georgetown', offset: -4, display: 'Guyana Time', abbreviation: 'GYT', city: 'Georgetown', country: 'Guyana' },
  { name: 'America/Paramaribo', offset: -3, display: 'Suriname Time', abbreviation: 'SRT', city: 'Paramaribo', country: 'Suriname' },
  { name: 'America/Cayenne', offset: -3, display: 'French Guiana Time', abbreviation: 'GFT', city: 'Cayenne', country: 'French Guiana' },
  
  // Central America & Caribbean
  { name: 'America/Guatemala', offset: -6, display: 'Central Time', abbreviation: 'CST', city: 'Guatemala City', country: 'Guatemala' },
  { name: 'America/Tegucigalpa', offset: -6, display: 'Central Time', abbreviation: 'CST', city: 'Tegucigalpa', country: 'Honduras' },
  { name: 'America/Managua', offset: -6, display: 'Central Time', abbreviation: 'CST', city: 'Managua', country: 'Nicaragua' },
  { name: 'America/San_Jose', offset: -6, display: 'Central Time', abbreviation: 'CST', city: 'San Jose', country: 'Costa Rica' },
  { name: 'America/Panama', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Panama City', country: 'Panama' },
  { name: 'America/Havana', offset: -5, display: 'Cuba Time', abbreviation: 'CST', city: 'Havana', country: 'Cuba' },
  { name: 'America/Santo_Domingo', offset: -4, display: 'Atlantic Time', abbreviation: 'AST', city: 'Santo Domingo', country: 'Dominican Republic' },
  { name: 'America/Port_au_Prince', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Port-au-Prince', country: 'Haiti' },
  { name: 'America/Kingston', offset: -5, display: 'Eastern Time', abbreviation: 'EST', city: 'Kingston', country: 'Jamaica' },
  { name: 'America/Bridgetown', offset: -4, display: 'Atlantic Time', abbreviation: 'AST', city: 'Bridgetown', country: 'Barbados' },
  { name: 'America/Port_of_Spain', offset: -4, display: 'Atlantic Time', abbreviation: 'AST', city: 'Port of Spain', country: 'Trinidad and Tobago' },
  { name: 'America/Caracas', offset: -4, display: 'Venezuela Time', abbreviation: 'VET', city: 'Caracas', country: 'Venezuela' },
  
  // Australia & Oceania
  { name: 'Australia/Melbourne', offset: 10, display: 'Australian Eastern Time', abbreviation: 'AEST', city: 'Melbourne', country: 'Australia' },
  { name: 'Australia/Perth', offset: 8, display: 'Australian Western Time', abbreviation: 'AWST', city: 'Perth', country: 'Australia' },
  { name: 'Australia/Brisbane', offset: 10, display: 'Australian Eastern Time', abbreviation: 'AEST', city: 'Brisbane', country: 'Australia' },
  { name: 'Australia/Adelaide', offset: 9.5, display: 'Australian Central Time', abbreviation: 'ACST', city: 'Adelaide', country: 'Australia' },
  { name: 'Australia/Darwin', offset: 9.5, display: 'Australian Central Time', abbreviation: 'ACST', city: 'Darwin', country: 'Australia' },
  { name: 'Australia/Hobart', offset: 10, display: 'Australian Eastern Time', abbreviation: 'AEST', city: 'Hobart', country: 'Australia' },
  { name: 'Pacific/Auckland', offset: 12, display: 'New Zealand Time', abbreviation: 'NZST', city: 'Auckland', country: 'New Zealand' },
  { name: 'Pacific/Wellington', offset: 12, display: 'New Zealand Time', abbreviation: 'NZST', city: 'Wellington', country: 'New Zealand' },
  { name: 'Pacific/Fiji', offset: 12, display: 'Fiji Time', abbreviation: 'FJT', city: 'Suva', country: 'Fiji' },
  { name: 'Pacific/Port_Moresby', offset: 10, display: 'Papua New Guinea Time', abbreviation: 'PGT', city: 'Port Moresby', country: 'Papua New Guinea' },
  { name: 'Pacific/Noumea', offset: 11, display: 'New Caledonia Time', abbreviation: 'NCT', city: 'Noumea', country: 'New Caledonia' },
  { name: 'Pacific/Tahiti', offset: -10, display: 'Tahiti Time', abbreviation: 'TAHT', city: 'Papeete', country: 'French Polynesia' },
  { name: 'Pacific/Honolulu', offset: -10, display: 'Hawaii Time', abbreviation: 'HST', city: 'Honolulu', country: 'USA' },
  { name: 'Pacific/Guam', offset: 10, display: 'Chamorro Time', abbreviation: 'ChST', city: 'Hagatna', country: 'Guam' },
  { name: 'Pacific/Saipan', offset: 10, display: 'Chamorro Time', abbreviation: 'ChST', city: 'Saipan', country: 'Northern Mariana Islands' },
  { name: 'Pacific/Palau', offset: 9, display: 'Palau Time', abbreviation: 'PWT', city: 'Ngerulmud', country: 'Palau' },
  { name: 'Pacific/Majuro', offset: 12, display: 'Marshall Islands Time', abbreviation: 'MHT', city: 'Majuro', country: 'Marshall Islands' },
  { name: 'Pacific/Tarawa', offset: 12, display: 'Kiribati Time', abbreviation: 'GILT', city: 'Tarawa', country: 'Kiribati' },
  { name: 'Pacific/Tongatapu', offset: 13, display: 'Tonga Time', abbreviation: 'TOT', city: 'Nuku\'alofa', country: 'Tonga' },
  { name: 'Pacific/Apia', offset: 13, display: 'Samoa Time', abbreviation: 'WST', city: 'Apia', country: 'Samoa' },
  { name: 'Pacific/Pago_Pago', offset: -11, display: 'Samoa Time', abbreviation: 'SST', city: 'Pago Pago', country: 'American Samoa' },
  { name: 'Pacific/Rarotonga', offset: -10, display: 'Cook Islands Time', abbreviation: 'CKT', city: 'Avarua', country: 'Cook Islands' },
  { name: 'Pacific/Niue', offset: -11, display: 'Niue Time', abbreviation: 'NUT', city: 'Alofi', country: 'Niue' },
  { name: 'Pacific/Tokelau', offset: 13, display: 'Tokelau Time', abbreviation: 'TKT', city: 'Fakaofo', country: 'Tokelau' },
  { name: 'Pacific/Wallis', offset: 12, display: 'Wallis and Futuna Time', abbreviation: 'WFT', city: 'Mata-Utu', country: 'Wallis and Futuna' },
  { name: 'Pacific/Vanuatu', offset: 11, display: 'Vanuatu Time', abbreviation: 'VUT', city: 'Port Vila', country: 'Vanuatu' },
  { name: 'Pacific/Solomon', offset: 11, display: 'Solomon Islands Time', abbreviation: 'SBT', city: 'Honiara', country: 'Solomon Islands' },
  { name: 'Pacific/Nauru', offset: 12, display: 'Nauru Time', abbreviation: 'NRT', city: 'Yaren', country: 'Nauru' },
  { name: 'Pacific/Tuvalu', offset: 12, display: 'Tuvalu Time', abbreviation: 'TVT', city: 'Funafuti', country: 'Tuvalu' }
]

interface ClockPosition {
  id: string
  timezone: TimezoneInfo
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top' | 'center-bottom'
  size: 'small' | 'medium' | 'large'
}

interface BloombergClockSystemProps {
  className?: string
  showSettings?: boolean
  onSettingsChange?: (show: boolean) => void
}

export function BloombergClockSystem({ showSettings: externalShowSettings, onSettingsChange }: BloombergClockSystemProps) {
  const { clockPositions, addClock, removeClock, hasUserSetClocks } = useClock()
  const [currentTime, setCurrentTime] = useState(new Date())
  const isMobile = useIsMobile()
  const [internalShowSettings, setInternalShowSettings] = useState(false)
  const hasAddedDefaults = useRef(false)
  
  // Use external settings state if provided, otherwise use internal state
  const showSettings = externalShowSettings !== undefined ? externalShowSettings : internalShowSettings
  const setShowSettings = onSettingsChange || setInternalShowSettings
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TimezoneInfo[]>([])

  // Auto-detect user's timezone and add default clocks if none exist
  useEffect(() => {
    // Add default clocks if none exist and we haven't added them yet
    if (clockPositions.length === 0 && !hasAddedDefaults.current && !hasUserSetClocks) {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const userOffset = new Date().getTimezoneOffset() / 60
      
      // Try to find exact match first
      let detectedTimezone = ALL_CITIES.find(tz => tz.name === userTimezone)
      
      // If no exact match, find by offset
      if (!detectedTimezone) {
        detectedTimezone = ALL_CITIES.find(tz => 
          Math.abs(tz.offset - userOffset) < 0.5
        )
      }
      
      // If still no match, create a custom entry
      if (!detectedTimezone) {
        const cityName = userTimezone.split('/').pop()?.replace(/_/g, ' ') || 'Local'
        detectedTimezone = {
          name: userTimezone,
          offset: userOffset,
          display: 'Local Time',
          abbreviation: 'LOCAL',
          city: cityName,
          country: 'Local'
        }
      }
      
      // Add default clocks
      const defaultClocks = [
        detectedTimezone!,
        MAJOR_CITIES.find(tz => tz.city === 'New York') || MAJOR_CITIES[0],
        MAJOR_CITIES.find(tz => tz.city === 'London') || MAJOR_CITIES[3],
        MAJOR_CITIES.find(tz => tz.city === 'Tokyo') || MAJOR_CITIES[6]
      ]
      
      // Add each default clock
      defaultClocks.forEach(timezone => {
        if (timezone) {
          addClock(timezone)
        }
      })
      hasAddedDefaults.current = true
    }
  }, [clockPositions.length, addClock, hasUserSetClocks])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = ALL_CITIES.filter(city => 
        city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10) // Limit to 10 results
      setSearchResults(filtered)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getTimezoneTime = (timezone: TimezoneInfo) => {
    // Use proper timezone conversion instead of hardcoded offsets
    try {
      // Try to use the actual timezone name if available
      if (timezone.name && timezone.name !== 'UTC') {
        // Get the current time in the target timezone
        const timeString = currentTime.toLocaleString('en-US', { 
          timeZone: timezone.name,
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        
        // Parse the time string back to a Date object
        const [datePart, timePart] = timeString.split(', ')
        const [month, day, year] = datePart.split('/')
        const [hour, minute, second] = timePart.split(':')
        
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 
                       parseInt(hour), parseInt(minute), parseInt(second))
      }
    } catch (error) {
      console.warn('Invalid timezone name:', timezone.name, error)
    }
    
    // Fallback: manual calculation (this will be inaccurate during DST)
    const utcTime = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000)
    const targetTime = new Date(utcTime + (timezone.offset * 3600000))
    return targetTime
  }

  const formatTime = (date: Date, showSeconds = false) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = showSeconds ? `:${date.getSeconds().toString().padStart(2, '0')}` : ''
    return `${hours}:${minutes}${seconds}`
  }


  const addClockToSystem = (timezone: TimezoneInfo) => {
    addClock(timezone)
    setSearchQuery('') // Clear search after adding
  }


  const getPositionClasses = (_index: number, size: ClockPosition['size'], isMobile: boolean) => {
    if (isMobile) {
      // Mobile: horizontal layout at the top
      return "flex items-center gap-2 px-2 py-1 bg-background/95 backdrop-blur-sm border border-border/20 rounded text-xs"
    } else {
      // Desktop: vertical layout on the left
      const baseClasses = "fixed z-[45] left-3"
      const sizeClasses = {
        small: "text-sm",
        medium: "text-base", 
        large: "text-lg"
      }
      return `${baseClasses} ${sizeClasses[size]}`
    }
  }

  const ClockComponent = ({ clock, index }: { clock: ClockPosition, index: number }) => {
    const timezoneTime = getTimezoneTime(clock.timezone)
    const positionClasses = getPositionClasses(index, clock.size, isMobile)
    const topOffset = 60 + (index * 48) // 60px to start below nav bar (48px nav + 12px margin) + 48px per clock
    
    if (isMobile) {
      // Mobile layout: thin horizontal line
      return (
        <div className={`${positionClasses} group min-w-fit flex-shrink-0 hover:bg-background transition-colors`}>
          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <div className="flex items-center gap-1 min-w-0 whitespace-nowrap">
            <span className="font-mono font-medium text-xs whitespace-nowrap">
              {formatTime(timezoneTime)}
            </span>
            <span className="text-xs text-muted-foreground/70 whitespace-nowrap hidden md:inline">
              {clock.timezone.city}
            </span>
            <span className="text-xs text-muted-foreground/50 whitespace-nowrap">
              {clock.timezone.abbreviation}
            </span>
          </div>
          
        </div>
      )
    } else {
      // Desktop layout: vertical stack on the left
      return (
        <div className={`${positionClasses} group`} style={{ top: `${topOffset}px` }}>
          <div className="flex items-center gap-3 px-3 py-2 border-b border-border/20 hover:bg-background/5 transition-colors duration-200 w-56 h-10">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2 flex-1 min-w-0 whitespace-nowrap">
              <span className="font-mono font-medium text-xs whitespace-nowrap">
                {formatTime(timezoneTime)}
              </span>
              <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                {clock.timezone.city}
              </span>
              <span className="text-xs text-muted-foreground/50 whitespace-nowrap">
                {clock.timezone.abbreviation}
              </span>
            </div>
            
            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeClock(clock.id)
              }}
              className="p-1 text-muted-foreground/40 hover:text-foreground hover:opacity-100 opacity-60 transition-all duration-200"
              title="Remove clock"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <>
      {/* Mobile: Horizontal clock bar at the top */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-[45] bg-background/95 backdrop-blur-sm border-b border-border/20 shadow-sm">
          <div className="relative">
            {/* Left fade indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background/95 to-transparent z-10 pointer-events-none"></div>
            {/* Right fade indicator */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background/95 to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide clock-scroll-container">
              {clockPositions.map((clock, index) => (
                <ClockComponent key={clock.id} clock={clock} index={index} />
              ))}
              {/* Add some padding at the end for better scrolling experience */}
              <div className="flex-shrink-0 w-2"></div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Vertical clock stack on the left */}
      {!isMobile && (
        <>
          {clockPositions.map((clock, index) => (
            <ClockComponent key={clock.id} clock={clock} index={index} />
          ))}
          {/* Add Clock Button */}
          <div 
            className="fixed z-[45] left-3 group cursor-pointer"
            style={{ top: `${60 + (clockPositions.length * 48)}px` }}
            onClick={() => setShowSettings(true)}
          >
            <div className="flex items-center gap-3 px-3 py-2 border-b border-border/20 hover:bg-background/5 transition-all duration-150 w-56 h-10">
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                Add Clock
              </span>
            </div>
          </div>
        </>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/30 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Clock Configuration</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-muted/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Add City Search */}
              <div>
                <h4 className="font-medium mb-3">Add City</h4>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a city (e.g., Paris, Tokyo, Dubai)"
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
                  />
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map(city => (
                      <button
                        key={city.name}
                        onClick={() => addClockToSystem(city)}
                        className="w-full flex items-center justify-between p-2 text-sm bg-muted/10 hover:bg-muted/20 rounded border border-border/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">{city.city}</span>
                          <span className="text-muted-foreground">({city.country})</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{city.abbreviation}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Clocks */}
              <div>
                <h4 className="font-medium mb-3">Current Clocks</h4>
                <div className="space-y-2">
                  {clockPositions.map(clock => (
                    <div key={clock.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{clock.timezone.city}</div>
                          <div className="text-sm text-muted-foreground">{clock.timezone.country} • {clock.timezone.abbreviation}</div>
                        </div>
                        </div>
                        <button
                          onClick={() => removeClock(clock.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Add Major Cities */}
              <div>
                <h4 className="font-medium mb-3">Quick Add</h4>
                <div className="grid grid-cols-2 gap-2">
                  {MAJOR_CITIES
                    .filter(city => !clockPositions.find(clock => clock.timezone.name === city.name))
                    .slice(0, 6)
                    .map(city => (
                      <button
                        key={city.name}
                        onClick={() => addClockToSystem(city)}
                        className="flex items-center gap-2 p-2 text-sm bg-muted/10 hover:bg-muted/20 rounded border border-border/20 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{city.city}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
