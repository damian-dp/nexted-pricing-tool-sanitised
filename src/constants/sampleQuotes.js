/**
 * Sample quotes for testing rule conditions
 */
export const SAMPLE_QUOTES = [
    {
        id: "sample_1",
        name: "International Student - VET Course",
        quote: {
            student_visa: true,
            onshore_offshore: "offshore",
            region_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", // Asia
            course_type: "VET",
            faculty_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", // Business
            campus_id: "cccccccc-cccc-cccc-cccc-cccccccccccc", // Sydney
            duration_weeks: 52,
            study_load: "full_time",
            day_night_classes: "day",
            intake_date: "2024-07-01",
            accommodation_type_id: "cccccccc-cccc-cccc-cccc-cccccccccccc", // Homestay
            room_size_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", // Single
            accommodation_price_per_week: 350,
            needs_transport: true,
            previous_student: false,
        },
    },
    {
        id: "sample_2",
        name: "Local Student - ELICOS Course",
        quote: {
            student_visa: false,
            onshore_offshore: "onshore",
            region_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", // Oceania
            course_type: "ELICOS",
            faculty_id: "cccccccc-cccc-cccc-cccc-cccccccccccc", // English
            campus_id: "dddddddd-dddd-dddd-dddd-dddddddddddd", // Melbourne
            duration_weeks: 12,
            study_load: "part_time",
            day_night_classes: "night",
            intake_date: "2024-05-01",
            accommodation_type_id: "dddddddd-dddd-dddd-dddd-dddddddddddd", // Student Residence
            room_size_id: "ffffffff-ffff-ffff-ffff-ffffffffffff", // Twin Share
            accommodation_price_per_week: 250,
            needs_transport: false,
            previous_student: true,
        },
    },
    {
        id: "sample_3",
        name: "Returning Student - VET Course",
        quote: {
            student_visa: true,
            onshore_offshore: "onshore",
            region_id: "cccccccc-cccc-cccc-cccc-cccccccccccc", // Europe
            course_type: "VET",
            faculty_id: "dddddddd-dddd-dddd-dddd-dddddddddddd", // IT
            campus_id: "cccccccc-cccc-cccc-cccc-cccccccccccc", // Sydney
            duration_weeks: 26,
            study_load: "full_time",
            day_night_classes: "day",
            intake_date: "2024-09-01",
            accommodation_type_id: null,
            room_size_id: null,
            accommodation_price_per_week: 0,
            needs_transport: false,
            previous_student: true,
        },
    },
];
