# Quote Generation Examples

<br>

## **1. Example Rules**

### **Pricing Rules** (`pricing_rules`)

1. **Offshore Surcharge**

    - `rule_description`: "Offshore Surcharge"
    - `applies_to`: `course_price`
    - `type`: `percent`
    - `value`: `5` (meaning +5%)
    - `conditions`:
        ```json
        {
            "onshore_offshore": { "eq": "offshore" }
        }
        ```

<br>

2. **Night Class Surcharge**
    - `rule_description`: "Night Class Surcharge"
    - `applies_to`: `course_price`
    - `type`: `fixed`
    - `value`: XXXX (Number)
    - `conditions`:
        ```json
        {
            "day_night_classes": { "eq": "night" }
        }
        ```

<br>

### **Fee Rules** (`fee_rules`)

1. **Enrolment Fee**
    - `fee_name`: "Enrolment Fee"
    - `applies_to`: `total_fee`
    - `type`: `fixed`
    - `value`: XXXX (Number)
    - `conditions`: `{}` (applies to everyone)

<br>

### **Discount Rules** (`discount_rules`)

1. **2 Free Weeks (ENGLISH)** (Course-specific)

    - `discount_name`: "2 Free Weeks (ENGLISH)"
    - `discount_description`: "2 free weeks for 32+ weeks ENGLISH"
    - `applies_to`: `course_price`
    - `type`: `fixed` (negative value)
    - `value`: `-XXXX` (e.g. 2 wks \* $XXX/week)
    - `conditions`:
        ```json
        {
            "course_type": { "eq": "ENGLISH" },
            "duration_weeks": { "gt": 32 }
        }
        ```

<br>

2. **Early Bird** (Quote-wide)
    - `discount_name`: "Early Bird (Quote-wide)"
    - `discount_description`: "Discount that applies to total if enrolled before a certain date"
    - `applies_to`: `total_price`
    - `type`: `fixed`
    - `value`: `-XXX` (Number)
    - `conditions`:
        ```json
        {
            "intake_date": { "lt": "2025-02-01" }
        }
        ```
    - This discount would appear **after** all courses & fees if it applies to the entire quote.

<br>

3. **Previous Student Discount** (Quote-wide)
    - `discount_name`: "Previous Student Discount"
    - `discount_description`: "Discount for previous students"
    - `applies_to`: `total_price`
    - `type`: `fixed`
    - `value`: `-XXXX` // Number
    - `conditions`:
        ```json
        {
            "previous_student": { "eq": true }
        }
        ```
    - This discount would appear at the bottom of the quote as it is defined as a quote-wide discount (`applies_to`: `total_price`).

<br>
<br>

## **2. Example `quoteData` Input**

```json
{
    "region_id": 1,
    "onshore_offshore": "offshore",
    "student_visa": false,

    "courses": [
        {
            "courseName": "Diploma of IT",
            "course_type": "VET",
            "duration_type": "fixed",
            "duration_weeks": 52,
            "day_night_classes": "day",
            "study_load": "full_time",
            "base_price": XXXX,
            "price_per_week": null
        },
        {
            "courseName": "General English",
            "course_type": "ENGLISH",
            "duration_type": "weekly",
            "duration_weeks": 35,
            "day_night_classes": "night",
            "study_load": "full_time",
            "base_price": null,
            "price_per_week": XXX
        }
    ],

    "accommodation_type": "Homestay",
    "room_size": "Single",
    "needsTransport": true
}
```

### **Initial Course Prices (Before Any Rules)**

-   **Course #1** (Diploma of IT): **$XXXX**
-   **Course #2** (General English): 35 wks @ $XXX/wk = **$XXXX**

<br>
<br>

## **3. Step-by-Step Calculation & Output**

The below calculation is based on the **rules** defined in section 1 above and the **input data** defined in section 2 above.

### **Course #1**: Diploma of IT

-   **Base**: $XXXX
-   **Offshore Surcharge (5%)**: +$XXX → $XXXX
-   **Night Class Surcharge**? Not applicable (day)
-   **Discount**? None (VET, not ENGLISH)
-   **Subtotal**: $XXXX

**Add to breakdown**:

```json
{
    "label": "Course #1: Diploma of IT",
    "amount": XXXX
}
```

<br>

### **Course #2**: General English

-   **Base**: $XXXX
-   **Night Class Surcharge** (+$XXX): $XXXX
-   **Offshore Surcharge** (5%): +$XXX → $XXXX
-   **2 Free Weeks (ENGLISH)** Discount: -$XXX → $XXXX

We insert the discount line **immediately** after listing this course:

1. **Course** line:

    ```json
    {
        "label": "Course #2: General English (Night + Offshore)",
        "amount": XXXX
    }
    ```

2. **Discount** line:
    ```json
    {
        "label": "Discount: 2 Free Weeks (ENGLISH) for Course #2",
        "amount": -XXX
    }
    ```

<br>

### **Sum of Both Courses** (so far) = $XXXX + $XXXX = **XXXX**

<br>

### **Transport**

-   e.g. +$XXX if `needsTransport`
-   New total = **$XXXX**

```json
{
    "label": "Transport",
    "amount": XXX
}
```

<br>

### **Enrolment Fee** (Fee Rule)

-   +$XXX → New total = **$XXXX**

```json
{
    "label": "Fee: Enrolment Fee",
    "amount": XXX
}
```

<br>

### **Quote-Wide Early Bird Discount**

-   If `intake_date < 2025-02-01`, -$XXX.
-   In this example, let's assume the user's intake date is 2025-01-15, so it qualifies.
-   New total = **$XXXX**

This discount is **quote-wide**, so it's added at the **end**:

```json
{
    "label": "Discount: Early Bird (Quote-wide)",
    "amount": -XXX
}
```

<br>
<br>

## **4. Final Output**

Putting it all together, and the breakdown will look like below. This is what we will use to fill in the PDF quote.

```json
{
    "finalPrice": XXXX,
    "breakdown": [
        {
            "label": "Course #1: Diploma of IT",
            "amount": XXXX
        },
        {
            "label": "Course #2: General English (Night + Offshore)",
            "amount": XXXX
        },
        {
            "label": "Discount: 2 Free Weeks (ENGLISH) for Course #2",
            "amount": -XXX
        },
        {
            "label": "Transport",
            "amount": XXX
        },
        {
            "label": "Fee: Enrollment Fee",
            "amount": XXX
        },
        {
            "label": "Discount: Early Bird (Quote-wide)",
            "amount": -XXX
        }
    ]
}
```

-   **finalPrice** = **$XXXX**
-   The **course-specific discount** appears **right after** the course it affects.
-   The **quote-wide discount** is **last**, because it applies to the final total.
