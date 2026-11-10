#!/usr/bin/env python3
"""Edexcel GCSE Maths Paper 3 (Higher, calculator) flashcards.

Each card: topic, question, answer, step-by-step explanation, optional tip.
Run: python3 cards.py  -> writes flashcards.csv and flashcards-data.json next to this file.
"""
import csv, json, os

C = []


def card(t, q, a, steps, tip=""):
    C.append({"t": t, "q": q, "a": a, "steps": steps, "tip": tip})


# ---------------- Calculator skills ----------------
card("Calculator skills", "Before Paper 3 starts, what setting must you check on your calculator?",
     "It must be in DEGREES mode (a small D at the top of the screen).",
     ["Trigonometry (sin, cos, tan) gives wrong answers if the calculator is in Radians (R) or Gradians (G).",
      "On a Casio: press SHIFT, then SETUP, then choose Deg.",
      "Quick test: type sin 30. If you get 0.5, you are in degrees."],
     "Do this check at the very start of the exam.")
card("Calculator skills", "How do you type (3.6 + 2.4) ÷ (1.5 × 4) into a calculator?",
     "Use brackets around the top and the bottom, or use the fraction button. The answer is 1.",
     ["Top: 3.6 + 2.4 = 6. Bottom: 1.5 × 4 = 6. So 6 ÷ 6 = 1.",
      "Without brackets, the calculator follows BIDMAS. It would work out 3.6 + (2.4 ÷ 1.5 × 4) = 10, which is wrong.",
      "The fraction button keeps the top and bottom separate for you."],
     "Whenever a fraction has a + or − on the top or bottom, put brackets round it.")
card("Calculator skills", "Round 0.0050642 to 3 significant figures.",
     "0.00506",
     ["Significant figures start at the first digit that isn't zero. Here that is the 5.",
      "Count 3 figures from there: 5, 0, 6.",
      "Look at the next digit, which is 4. It is less than 5, so you don't round up.",
      "Keep the zeros at the front so the number stays the same size: 0.00506."],
     "Zeros at the front never count as significant figures.")

# ---------------- Number ----------------
card("Percentages", "£2500 is invested at 3.5% compound interest per year. How much is it worth after 4 years?",
     "£2868.81",
     ["Compound interest means each year's interest is added on, and next year's interest is worked out on the new total.",
      "A 3.5% increase means you end up with 103.5%, so the multiplier is 1.035.",
      "You multiply by 1.035 once for each year, so 4 years means 1.035⁴.",
      "2500 × 1.035⁴ = 2868.8075…",
      "Money goes to 2 decimal places: £2868.81."],
     "Simple interest would be different: 3.5% of £2500 is £87.50, and 4 × £87.50 = £350 gives £2850. Check which type of interest the question says.")
card("Percentages", "A car worth £18 000 loses 12% of its value each year. What is it worth after 3 years?",
     "£12 266.50",
     ["Losing 12% means you keep 100% − 12% = 88%.",
      "So the multiplier is 0.88.",
      "The value goes down for 3 years, so multiply by 0.88 three times: 0.88³.",
      "18 000 × 0.88³ = 12 266.496",
      "Round to the nearest penny: £12 266.50."],
     "Don't do 12% × 3 = 36%. Each year's 12% is taken from a smaller amount.")
card("Percentages", "After a 20% increase, a price is £84. What was the original price?",
     "£70",
     ["The new price is 100% + 20% = 120% of the original.",
      "So original × 1.2 = 84.",
      "To undo × 1.2, divide by 1.2: 84 ÷ 1.2 = 70.",
      "Check: 70 × 1.2 = 84 ✔"],
     "Don't take 20% off £84. That gives £67.20, which is wrong, because the 20% was added to the original price, not to £84.")
card("Percentages", "A price goes up from £45 to £52.20. What is the percentage increase?",
     "16%",
     ["Find the change: 52.20 − 45 = 7.20",
      "Divide by the ORIGINAL amount: 7.20 ÷ 45 = 0.16",
      "Multiply by 100 to make it a percentage: 16%"],
     "Percentage change = change ÷ original × 100. Always divide by the original amount.")
card("Percentages", "A car bought for £15 000 is worth £12 000 two years later. It lost the same percentage each year. What was that percentage?",
     "About 10.6% per year",
     ["Call the yearly multiplier m. After 2 years: 15 000 × m² = 12 000.",
      "Divide both sides by 15 000: m² = 0.8",
      "Square root both sides: m = √0.8 = 0.8944…",
      "A multiplier of 0.8944 means the car keeps 89.44% each year.",
      "So it loses 100 − 89.44 = 10.56%, which is about 10.6% per year."],
     "Losing 20% over 2 years is NOT 10% per year, because of compounding.")
card("Growth and decay", "There are 500 bacteria, and the number doubles every hour. How many are there after 6 hours?",
     "32 000",
     ["Doubling means the multiplier is 2.",
      "After t hours: N = 500 × 2ᵗ",
      "2⁶ = 64",
      "500 × 64 = 32 000"],
     "Growth and decay questions are all 'start amount × multiplier to the power of time'.")
card("Standard form", "Work out (3.2 × 10⁵) × (4.5 × 10⁻²). Give your answer in standard form.",
     "1.44 × 10⁴",
     ["Multiply the front numbers: 3.2 × 4.5 = 14.4",
      "Multiply the powers of 10 by adding the powers: 10⁵ × 10⁻² = 10³",
      "That gives 14.4 × 10³. But 14.4 is not between 1 and 10.",
      "14.4 = 1.44 × 10¹, so the answer is 1.44 × 10⁴.",
      "On a calculator, use the ×10ˣ key. The answer is 14 400 = 1.44 × 10⁴."],
     "In standard form, the front number must be at least 1 and less than 10.")

# ---------------- Bounds ----------------
card("Bounds", "x = 6.4, rounded to 1 decimal place. Write the error interval for x.",
     "6.35 ≤ x < 6.45",
     ["Rounding to 1 decimal place means rounding to the nearest 0.1.",
      "Half of 0.1 is 0.05.",
      "Lower bound: 6.4 − 0.05 = 6.35. Upper bound: 6.4 + 0.05 = 6.45.",
      "Use ≤ on the lower bound and < on the upper bound, because 6.45 itself would round up to 6.5."],
     "")
card("Bounds", "x = 3.8, truncated to 1 decimal place. Write the error interval for x.",
     "3.8 ≤ x < 3.9",
     ["Truncating means chopping off the extra digits. You never round up.",
      "So 3.8, 3.85 and 3.899 all truncate to 3.8.",
      "x can be anything from 3.8 up to just below 3.9."],
     "Truncated: the interval starts at the number. Rounded: the number is in the middle of the interval.")
card("Bounds", "A distance is 100 m to the nearest metre. A time is 12.4 s to 1 decimal place. Find the upper bound of the speed.",
     "8.14 m/s (8.1376…)",
     ["Speed = distance ÷ time.",
      "To make a division as BIG as possible, divide the biggest top by the smallest bottom.",
      "Distance bounds: 99.5 to 100.5, so use 100.5.",
      "Time bounds: 12.35 to 12.45, so use 12.35.",
      "100.5 ÷ 12.35 = 8.1376… m/s"],
     "Biggest ÷ → upper ÷ lower. Smallest ÷ → lower ÷ upper. For minus, it's the same idea: biggest a − b = upper a − lower b.")

# ---------------- Counting / best buy ----------------
card("Counting", "A menu has 3 starters, 5 mains and 4 desserts. How many different 3-course meals are possible?",
     "60",
     ["For each starter, you can pick any of the 5 mains, and for each of those, any of the 4 desserts.",
      "So multiply the number of choices together: 3 × 5 × 4 = 60."],
     "This is called the product rule for counting: multiply the choices.")
card("Best buy", "Which is better value: 500 g for £2.40, or 750 g for £3.45?",
     "750 g for £3.45",
     ["Compare the price of the same amount, for example 100 g.",
      "500 g: £2.40 ÷ 5 = £0.48 per 100 g",
      "750 g: £3.45 ÷ 7.5 = £0.46 per 100 g",
      "46p is less than 48p, so the 750 g pack is better value."],
     "Always show both calculations and write a clear conclusion.")

# ---------------- Iteration ----------------
card("Iteration", "Show that x³ + 2x − 5 = 0 has a solution between x = 1 and x = 2.",
     "When x = 1 the value is −2 (negative). When x = 2 it is 7 (positive). The sign changes, so there is a solution in between.",
     ["Put x = 1 into x³ + 2x − 5: 1 + 2 − 5 = −2",
      "Put x = 2 in: 8 + 4 − 5 = 7",
      "The value goes from negative to positive, so the graph must cross 0 somewhere between x = 1 and x = 2.",
      "Write a conclusion sentence: 'There is a sign change, so there is a root between 1 and 2.'"],
     "You get the marks for showing both values AND saying 'sign change'.")
card("Iteration", "Use xₙ₊₁ = ∛(5 − 2xₙ) with x₀ = 1.5 to find x₁, x₂ and x₃.",
     "x₁ = 1.2599…, x₂ = 1.3536…, x₃ = 1.3186…",
     ["Iteration means putting each answer back into the formula to get the next one.",
      "On the calculator, type 1.5 and press =. This stores 1.5 as 'Ans'.",
      "Now type ∛(5 − 2Ans) and press =. That gives x₁ = 1.2599…",
      "Press = again: x₂ = 1.3536…",
      "Press = again: x₃ = 1.3186…"],
     "Using the Ans key saves time and avoids typing mistakes. Write down at least 4 decimal places.")

# ---------------- Algebra ----------------
card("Quadratics", "Solve 3x² − 5x − 4 = 0. Give your answers to 2 decimal places.",
     "x = 2.26 or x = −0.59",
     ["'2 decimal places' tells you it won't factorise, so use the quadratic formula: x = (−b ± √(b² − 4ac)) ÷ 2a",
      "Write down a = 3, b = −5, c = −4 (keep the signs!).",
      "b² − 4ac = (−5)² − 4 × 3 × (−4) = 25 + 48 = 73",
      "x = (5 ± √73) ÷ 6",
      "With +: (5 + 8.544) ÷ 6 = 2.257 → 2.26",
      "With −: (5 − 8.544) ÷ 6 = −0.5907 → −0.59"],
     "Because b = −5, −b is +5. Put negative numbers in brackets when you square them.")
card("Quadratics", "Write x² − 8x + 3 in the form (x − p)² + q. Then give the turning point of y = x² − 8x + 3.",
     "(x − 4)² − 13. The turning point is (4, −13).",
     ["Halve the number in front of x: half of −8 is −4, so write (x − 4)².",
      "(x − 4)² = x² − 8x + 16. That has an extra 16, so subtract it: (x − 4)² − 16",
      "Add the original + 3: (x − 4)² − 16 + 3 = (x − 4)² − 13",
      "The smallest (x − 4)² can be is 0, which happens when x = 4. Then y = −13.",
      "So the turning point is (4, −13)."],
     "Turning point = (opposite of the number in the bracket, the number outside).")
card("Inequalities", "Solve x² − 3x − 10 > 0",
     "x < −2 or x > 5",
     ["Solve x² − 3x − 10 = 0 first: (x − 5)(x + 2) = 0, so x = 5 or x = −2.",
      "Sketch y = x² − 3x − 10. It is a U shape crossing the x-axis at −2 and 5.",
      "'> 0' means the parts of the graph ABOVE the x-axis.",
      "The U shape is above the axis on the outside of the two roots: x < −2 or x > 5."],
     "> 0 → outside the roots (two separate inequalities). < 0 → between the roots (one inequality, like −2 < x < 5).")
card("Inequalities", "Solve 3x − 7 < 11 and list the positive whole numbers that fit.",
     "x < 6, so 1, 2, 3, 4, 5",
     ["Add 7 to both sides: 3x < 18",
      "Divide by 3: x < 6",
      "Positive whole numbers less than 6: 1, 2, 3, 4, 5. (Not 6, because x must be LESS than 6.)"],
     "If you multiply or divide by a negative number, flip the inequality sign.")
card("Rearranging", "Make r the subject of V = ⅓πr²h",
     "r = √(3V ÷ (πh))",
     ["Get rid of the ⅓ by multiplying both sides by 3: 3V = πr²h",
      "Get r² on its own by dividing both sides by πh: r² = 3V ÷ (πh)",
      "Undo the square by square rooting both sides: r = √(3V ÷ (πh))"],
     "Undo the operations in the opposite order to how they were done to r.")
card("Rearranging", "Make x the subject of ax + 3 = bx − 7",
     "x = 10 ÷ (b − a)",
     ["x appears twice, so get both x terms on the same side: take ax from both sides and add 7 to both sides.",
      "This gives 3 + 7 = bx − ax, so 10 = bx − ax",
      "Factorise out x: 10 = x(b − a)",
      "Divide by (b − a): x = 10 ÷ (b − a)"],
     "When the subject appears twice: collect the terms, then factorise.")
card("Simultaneous equations", "Solve: 4x + 3y = 25 and 2x − y = 5",
     "x = 4, y = 3",
     ["Make the y's match: multiply the second equation by 3 to get 6x − 3y = 15",
      "The signs on 3y are different (+3y and −3y), so ADD the equations: 10x = 40",
      "x = 4",
      "Put x = 4 into 2x − y = 5: 8 − y = 5, so y = 3",
      "Check in the first equation: 16 + 9 = 25 ✔"],
     "Same signs → subtract. Different signs → add.")
card("Simultaneous equations", "Solve: x² + y² = 25 and y = x + 1",
     "x = 3, y = 4 or x = −4, y = −3",
     ["Substitute y = x + 1 into the circle equation: x² + (x + 1)² = 25",
      "Expand: x² + x² + 2x + 1 = 25, so 2x² + 2x − 24 = 0",
      "Divide by 2: x² + x − 12 = 0",
      "Factorise: (x + 4)(x − 3) = 0, so x = 3 or x = −4",
      "Use y = x + 1 for each: x = 3 gives y = 4, and x = −4 gives y = −3.",
      "Check: 3² + 4² = 25 ✔"],
     "There are 2 pairs of answers. These are the 2 points where the line crosses the circle.")
card("Sequences", "Find the nth term of 3, 9, 19, 33, 51",
     "2n² + 1",
     ["First differences: 6, 10, 14, 18. These are not the same, so it's quadratic.",
      "Second differences: 4, 4, 4. Halve this to get 2, so the sequence starts with 2n².",
      "Write out 2n² for n = 1, 2, 3…: 2, 8, 18, 32, 50",
      "Sequence − 2n²: 3−2, 9−8, 19−18… = 1, 1, 1, 1, 1",
      "So add 1: the nth term is 2n² + 1. Check n = 3: 18 + 1 = 19 ✔"],
     "")
card("Functions", "f(x) = 2x + 3 and g(x) = x². Find fg(3) and gf(3).",
     "fg(3) = 21 and gf(3) = 81",
     ["fg(3) means do g first, then f. Work from the right.",
      "g(3) = 3² = 9, then f(9) = 2 × 9 + 3 = 21",
      "gf(3) means do f first: f(3) = 2 × 3 + 3 = 9, then g(9) = 9² = 81"],
     "The function nearest to the x happens first.")
card("Functions", "f(x) = (x − 5) ÷ 2. Find f⁻¹(x).",
     "f⁻¹(x) = 2x + 5",
     ["Write y = (x − 5) ÷ 2",
      "Make x the subject: × 2 gives 2y = x − 5, then + 5 gives x = 2y + 5",
      "Swap y for x: f⁻¹(x) = 2x + 5",
      "Check: f(7) = 1, and f⁻¹(1) = 7 ✔"],
     "The inverse undoes the function, so you undo each step in reverse order.")
card("Algebraic fractions", "Simplify (x² − 16) ÷ (x² + x − 12)",
     "(x − 4) ÷ (x − 3)",
     ["Factorise the top using the difference of two squares: x² − 16 = (x + 4)(x − 4)",
      "Factorise the bottom: x² + x − 12 = (x + 4)(x − 3)",
      "(x + 4) is on both the top and the bottom, so cancel it.",
      "That leaves (x − 4) ÷ (x − 3)"],
     "You can only cancel whole brackets, never single terms.")
card("Proof", "Prove that the sum of two consecutive odd numbers is a multiple of 4.",
     "(2n + 1) + (2n + 3) = 4n + 4 = 4(n + 1), which is a multiple of 4.",
     ["Any odd number can be written as 2n + 1. The next odd number is 2 more: 2n + 3.",
      "Add them: 2n + 1 + 2n + 3 = 4n + 4",
      "Factorise: 4(n + 1)",
      "4 × (a whole number) is always a multiple of 4. Finish with that sentence."],
     "Proofs need algebra (n), not just examples with numbers.")

# ---------------- Proportion ----------------
card("Proportion", "y is directly proportional to √x. When x = 16, y = 12. Find y when x = 36.",
     "y = 18",
     ["Write the equation: y = k√x",
      "Put in x = 16 and y = 12: 12 = k × 4, so k = 3",
      "Full equation: y = 3√x",
      "When x = 36: y = 3 × 6 = 18"],
     "Same 3 steps every time: write it with k, find k, then use it.")
card("Proportion", "F is inversely proportional to d². When d = 2, F = 200. Find F when d = 5.",
     "F = 32",
     ["Inversely proportional means divide: F = k ÷ d²",
      "Put in the values: 200 = k ÷ 4, so k = 800",
      "Full equation: F = 800 ÷ d²",
      "When d = 5: F = 800 ÷ 25 = 32"],
     "Inverse proportion: as d goes up, F goes down.")

# ---------------- Graphs ----------------
card("Straight lines", "Find the equation of the line through (2, 7) and (6, 15).",
     "y = 2x + 3",
     ["Gradient = change in y ÷ change in x = (15 − 7) ÷ (6 − 2) = 8 ÷ 4 = 2",
      "So y = 2x + c",
      "Put in the point (2, 7): 7 = 2 × 2 + c, so c = 3",
      "y = 2x + 3"],
     "")
card("Straight lines", "Find the equation of the line perpendicular to y = 3x − 2 that passes through (6, 1).",
     "y = −⅓x + 3",
     ["Perpendicular gradient: flip the gradient and change its sign. 3 becomes −⅓.",
      "So y = −⅓x + c",
      "Put in (6, 1): 1 = −⅓ × 6 + c, so 1 = −2 + c, and c = 3",
      "y = −⅓x + 3"],
     "Perpendicular gradients multiply to −1: 3 × (−⅓) = −1 ✔")
card("Circles", "Find the equation of the tangent to the circle x² + y² = 25 at the point (3, 4).",
     "y = −¾x + 25/4  (or 3x + 4y = 25)",
     ["The circle's centre is (0, 0). The radius to (3, 4) has gradient 4 ÷ 3 = 4/3.",
      "A tangent is at 90° to the radius, so its gradient is −3/4 (flip it and change the sign).",
      "y = −¾x + c. Put in (3, 4): 4 = −9/4 + c, so c = 4 + 9/4 = 25/4",
      "y = −¾x + 25/4"],
     "x² + y² = r² is a circle with centre (0, 0) and radius r. Here r = 5.")
card("Graphs", "The curve y = abˣ passes through (0, 3) and (2, 48). Find a and b.",
     "a = 3, b = 4",
     ["Put in x = 0: y = a × b⁰ = a × 1 = a. Since y = 3 when x = 0, a = 3.",
      "Put in (2, 48): 48 = 3 × b²",
      "b² = 16, so b = 4 (b must be positive for an exponential graph)."],
     "Anything to the power 0 is 1. That's why x = 0 gives you 'a' straight away.")
card("Graphs", "How do you estimate the gradient of a curve at a point? What does it mean?",
     "Draw a tangent at that point, then work out the tangent's gradient (up ÷ across). It is the RATE OF CHANGE at that moment.",
     ["Use a ruler to draw a straight line that just touches the curve at the point (a tangent).",
      "Pick two points far apart on your tangent line.",
      "Gradient = change in y ÷ change in x.",
      "On a distance–time graph, this gradient is the speed. On a velocity–time graph, it is the acceleration."],
     "Always give units, for example m/s.")
card("Graphs", "A car speeds up steadily from 0 to 12 m/s in 4 seconds, then stays at 12 m/s for 6 seconds. How far does it travel?",
     "96 m",
     ["On a velocity–time graph, distance = the AREA under the graph.",
      "First 4 seconds: a triangle. Area = ½ × 4 × 12 = 24",
      "Next 6 seconds: a rectangle. Area = 6 × 12 = 72",
      "Total distance = 24 + 72 = 96 m"],
     "Split the area into triangles, rectangles and trapezia.")
card("Graph transformations", "y = f(x) has a maximum point at (2, 5). Where is the maximum of y = f(x − 3)? And of y = f(x) + 4?",
     "f(x − 3): (5, 5). f(x) + 4: (2, 9).",
     ["Inside the bracket, the change affects x, and it does the OPPOSITE of what you'd expect: f(x − 3) moves the graph 3 to the RIGHT. So (2, 5) → (5, 5).",
      "Outside the bracket, the change affects y as you'd expect: + 4 moves the graph UP 4. So (2, 5) → (2, 9).",
      "Also: −f(x) reflects in the x-axis, so (2, 5) → (2, −5). And f(−x) reflects in the y-axis, so (2, 5) → (−2, 5)."],
     "Inside the bracket → x changes, the opposite way. Outside → y changes, the normal way.")

# ---------------- Ratio & measures ----------------
card("Ratio", "A and B share money in the ratio 3 : 5. B gets £36 more than A. How much does A get?",
     "£54",
     ["The difference between the parts is 5 − 3 = 2 parts.",
      "2 parts = £36, so 1 part = £18.",
      "A has 3 parts: 3 × 18 = £54. (B gets 5 × 18 = £90, and 90 − 54 = 36 ✔)"],
     "")
card("Ratio", "a : b = 2 : 3 and b : c = 4 : 5. Find a : b : c.",
     "8 : 12 : 15",
     ["b is in both ratios, so make b the same number in each.",
      "b is 3 in the first and 4 in the second. The LCM of 3 and 4 is 12.",
      "First ratio × 4: 8 : 12. Second ratio × 3: 12 : 15",
      "Combine them: 8 : 12 : 15"],
     "")
card("Compound measures", "Convert 72 km/h into m/s.",
     "20 m/s",
     ["72 km = 72 000 m",
      "1 hour = 60 × 60 = 3600 seconds",
      "72 000 ÷ 3600 = 20 m/s"],
     "Shortcut: km/h ÷ 3.6 = m/s.")
card("Compound measures", "A car travels 150 km in 2 hours 45 minutes. What is its average speed?",
     "54.5 km/h (to 1 d.p.)",
     ["Change the time into hours: 45 minutes = 45 ÷ 60 = 0.75 hours. So the time is 2.75 hours.",
      "Speed = distance ÷ time = 150 ÷ 2.75 = 54.545…",
      "54.5 km/h"],
     "Don't type 2.45. 2 hours 45 minutes is 2.75 hours.")
card("Compound measures", "Aluminium has a density of 2.7 g/cm³. What is the mass of 250 cm³ of aluminium?",
     "675 g",
     ["Density = mass ÷ volume, so mass = density × volume.",
      "2.7 × 250 = 675 g"],
     "Formula triangle: Mass on top, Density × Volume underneath. Cover the one you want.")
card("Compound measures", "A force of 600 N acts on an area of 0.25 m². Find the pressure.",
     "2400 N/m²",
     ["Pressure = force ÷ area",
      "600 ÷ 0.25 = 2400 N/m²"],
     "Dividing by 0.25 is the same as multiplying by 4.")

# ---------------- Trigonometry & Pythagoras ----------------
card("Pythagoras", "A right-angled triangle has shorter sides 7.2 cm and 9.6 cm. Find the longest side.",
     "12 cm",
     ["The longest side (the hypotenuse) is opposite the right angle. Use a² + b² = c².",
      "Finding the longest side, so ADD the squares: 7.2² + 9.6² = 51.84 + 92.16 = 144",
      "Square root: √144 = 12 cm"],
     "Longest side → add. Shorter side → subtract.")
card("Trigonometry", "The hypotenuse is 12 cm and the angle is 35°. Find the side opposite the angle, to 1 d.p.",
     "6.9 cm",
     ["Label the sides from the 35° angle: you have H (12) and want O.",
      "O and H → SOH: sin 35° = O ÷ 12",
      "Multiply both sides by 12: O = 12 × sin 35°",
      "12 × sin 35° = 6.883… → 6.9 cm"],
     "SOH CAH TOA: Sin = O/H, Cos = A/H, Tan = O/A.")
card("Trigonometry", "In a right-angled triangle, the opposite side is 7 cm and the adjacent side is 10 cm. Find the angle.",
     "35.0° (to 1 d.p.)",
     ["You have O and A → TOA: tan θ = 7 ÷ 10 = 0.7",
      "To find an ANGLE, use the inverse: θ = tan⁻¹(0.7)",
      "On the calculator: SHIFT, tan, 0.7 = 34.99…",
      "θ = 35.0°"],
     "Finding an angle → use SHIFT (sin⁻¹, cos⁻¹, tan⁻¹).")
card("Trigonometry", "How do you choose between the sine rule and the cosine rule?",
     "If you know a side AND the angle opposite it → sine rule. Otherwise → cosine rule.",
     ["Sine rule: a/sin A = b/sin B. You need a matching pair (a side and its opposite angle).",
      "Cosine rule for a side: a² = b² + c² − 2bc cos A. Use it when you know 2 sides and the angle BETWEEN them.",
      "Cosine rule for an angle: cos A = (b² + c² − a²) ÷ 2bc. Use it when you know all 3 sides.",
      "For a right-angled triangle, just use SOH CAH TOA or Pythagoras."],
     "Label the sides a, b, c, with each side opposite its matching angle A, B, C.")
card("Trigonometry", "Triangle ABC: angle A = 70°, angle B = 48°, side b = 9 cm. Find side a (to 1 d.p.).",
     "11.4 cm",
     ["You know side b and its opposite angle B, so use the sine rule: a/sin A = b/sin B",
      "a/sin 70° = 9/sin 48°",
      "Multiply both sides by sin 70°: a = 9 × sin 70° ÷ sin 48°",
      "= 11.38… → 11.4 cm"],
     "Put the side you want on top, so it's easier to rearrange.")
card("Trigonometry", "Side a = 6 cm, angle A = 40°, side b = 8 cm. Find the acute angle B (to 1 d.p.).",
     "59.0°",
     ["You know side a and its opposite angle A, so use the sine rule with the angles on top: sin B/b = sin A/a",
      "sin B/8 = sin 40°/6",
      "sin B = 8 × sin 40° ÷ 6 = 0.857…",
      "B = sin⁻¹(0.857…) = 58.98… → 59.0°"],
     "When finding an angle, put the sines on top.")
card("Trigonometry", "Sides b = 7 cm and c = 10 cm, with angle A = 55° between them. Find side a (to 1 d.p.).",
     "8.3 cm",
     ["You have 2 sides and the angle between them → cosine rule: a² = b² + c² − 2bc cos A",
      "a² = 7² + 10² − 2 × 7 × 10 × cos 55°",
      "a² = 49 + 100 − 140 × 0.5736 = 68.70…",
      "a = √68.70 = 8.29 → 8.3 cm"],
     "Work out a² first, then don't forget to square root at the end.")
card("Trigonometry", "A triangle has sides 5 cm, 7 cm and 9 cm. Find the largest angle (to 1 d.p.).",
     "95.7°",
     ["The largest angle is opposite the longest side (9 cm).",
      "You know all 3 sides → cosine rule for an angle: cos C = (a² + b² − c²) ÷ 2ab",
      "cos C = (5² + 7² − 9²) ÷ (2 × 5 × 7) = (25 + 49 − 81) ÷ 70 = −7 ÷ 70 = −0.1",
      "C = cos⁻¹(−0.1) = 95.7°"],
     "A negative cosine means the angle is obtuse (more than 90°). That's fine.")
card("Trigonometry", "Find the area of a triangle with sides 8 cm and 11 cm and an angle of 65° between them.",
     "39.9 cm²",
     ["Area = ½ × a × b × sin C, where C is the angle BETWEEN sides a and b.",
      "½ × 8 × 11 × sin 65°",
      "= 44 × 0.9063 = 39.88 → 39.9 cm²"],
     "Use this when there's no perpendicular height.")
card("3D shapes", "A cuboid measures 3 cm by 4 cm by 12 cm. Find the length of the diagonal from one corner to the opposite corner.",
     "13 cm",
     ["First find the diagonal of the base (3 by 4) using Pythagoras: √(3² + 4²) = √25 = 5",
      "That base diagonal, the height 12 and the space diagonal make a right-angled triangle.",
      "Space diagonal = √(5² + 12²) = √169 = 13 cm",
      "Shortcut: d = √(3² + 4² + 12²) = √169 = 13"],
     "3D Pythagoras: d² = a² + b² + c²")
card("3D shapes", "Same cuboid (base 3 cm × 4 cm, height 12 cm). Find the angle between the space diagonal and the base.",
     "67.4°",
     ["Draw the right-angled triangle: base diagonal = 5 (adjacent), height = 12 (opposite).",
      "tan θ = opposite ÷ adjacent = 12 ÷ 5 = 2.4",
      "θ = tan⁻¹(2.4) = 67.38… → 67.4°"],
     "Find the right-angled triangle inside the 3D shape, then use SOH CAH TOA.")
card("Bearings", "A ship sails 8 km on a bearing of 050°. How far east and how far north of its start is it?",
     "6.13 km east and 5.14 km north",
     ["Draw a North line. The bearing 050° is measured clockwise from North.",
      "The 8 km path is the hypotenuse. The angle at the start, between North and the path, is 50°.",
      "East is opposite the 50° angle: 8 × sin 50° = 6.13 km",
      "North is adjacent to the 50° angle: 8 × cos 50° = 5.14 km"],
     "Always draw a sketch with a North arrow.")
card("Bearings", "The bearing of B from A is 125°. What is the bearing of A from B?",
     "305°",
     ["A back bearing points the opposite way, which is 180° different.",
      "125° + 180° = 305°"],
     "If the bearing is more than 180°, subtract 180° instead. Always write 3 figures.")

# ---------------- Circles, area, volume ----------------
card("Circles", "A sector has radius 9 cm and angle 40°. Find its arc length and area (to 1 d.p.).",
     "Arc = 6.3 cm. Area = 28.3 cm².",
     ["A sector is the fraction 40/360 of a whole circle.",
      "Arc length = 40/360 × 2π × 9 = 6.28… → 6.3 cm",
      "Area = 40/360 × π × 9² = 28.27… → 28.3 cm²"],
     "Arc goes with circumference (2πr). Area goes with πr².")
card("Circles", "A sector has radius 7 cm and angle 120°. Find its perimeter (to 1 d.p.).",
     "28.7 cm",
     ["The perimeter of a sector = 2 radii + the arc.",
      "Arc = 120/360 × 2π × 7 = 14.66 cm",
      "Perimeter = 7 + 7 + 14.66 = 28.66 → 28.7 cm"],
     "Don't forget the two straight edges!")
card("Volume", "A cone has radius 4 cm and height 9 cm. Find its volume.",
     "48π cm³ ≈ 150.8 cm³",
     ["Volume of a cone = ⅓πr²h",
      "⅓ × π × 4² × 9 = ⅓ × π × 16 × 9 = 48π",
      "48π = 150.8 cm³ (to 1 d.p.)"],
     "The formula is on the paper's formula sheet, but you need to know which numbers go where.")
card("Volume", "A cone has radius 5 cm and vertical height 12 cm. Find its curved surface area.",
     "65π cm² ≈ 204.2 cm²",
     ["Curved surface area = πrl, where l is the SLANT height, not the vertical height.",
      "Find l with Pythagoras: l = √(5² + 12²) = √169 = 13",
      "πrl = π × 5 × 13 = 65π = 204.2 cm²"],
     "Vertical height (h) is for volume. Slant height (l) is for surface area.")
card("Volume", "Find the volume of a sphere with radius 6 cm.",
     "288π cm³ ≈ 904.8 cm³",
     ["Volume of a sphere = (4/3)πr³",
      "6³ = 216",
      "(4/3) × π × 216 = 288π = 904.8 cm³"],
     "Surface area of a sphere = 4πr².")
card("Volume", "A cone (height 20 cm, radius 10 cm) has a small cone (height 10 cm, radius 5 cm) cut off its top. Find the volume of the frustum that's left.",
     "1750π/3 ≈ 1832.6 cm³",
     ["Frustum = big cone − small cone.",
      "Big cone: ⅓ × π × 10² × 20 = 2000π/3",
      "Small cone: ⅓ × π × 5² × 10 = 250π/3",
      "Frustum = 2000π/3 − 250π/3 = 1750π/3 = 1832.6 cm³"],
     "")
card("Similar shapes", "Two similar shapes have lengths in the ratio 2 : 3. The small one has an area of 20 cm². Find the area of the large one.",
     "45 cm²",
     ["Length scale factor k = 3 ÷ 2 = 1.5",
      "Area scale factor = k² = 1.5² = 2.25",
      "Large area = 20 × 2.25 = 45 cm²"],
     "Length × k. Area × k². Volume × k³.")
card("Similar shapes", "Two similar solids have lengths in the ratio 2 : 3. The small one has a volume of 40 cm³. Find the volume of the large one.",
     "135 cm³",
     ["Length scale factor k = 1.5",
      "Volume scale factor = k³ = 1.5³ = 3.375",
      "Large volume = 40 × 3.375 = 135 cm³"],
     "")
card("Similar shapes", "Two similar solids have surface areas of 16 cm² and 25 cm². Find the ratio of their volumes.",
     "64 : 125",
     ["Area ratio = 16 : 25. Square root it to get the length ratio: 4 : 5",
      "Cube the length ratio to get the volume ratio: 4³ : 5³ = 64 : 125"],
     "Always go back to LENGTHS first, then go to whatever you need.")
card("Angles", "Each interior angle of a regular polygon is 150°. How many sides does it have?",
     "12",
     ["Interior + exterior = 180° (they sit on a straight line), so exterior = 180 − 150 = 30°",
      "The exterior angles of any polygon add to 360°.",
      "Number of sides = 360 ÷ 30 = 12"],
     "")
card("Circle theorems", "An angle at the circumference is 38°. What is the angle at the centre on the same arc?",
     "76°",
     ["Theorem: the angle at the centre is TWICE the angle at the circumference.",
      "2 × 38° = 76°"],
     "Always write the theorem as your reason.")
card("Circle theorems", "In a cyclic quadrilateral, one angle is 112°. What is the opposite angle?",
     "68°",
     ["Theorem: opposite angles in a cyclic quadrilateral add up to 180°.",
      "180° − 112° = 68°"],
     "Cyclic quadrilateral = all 4 corners touch the circle.")
card("Circle theorems", "List the main circle theorems.",
     "Centre = 2 × circumference · Semicircle = 90° · Same segment angles are equal · Cyclic quad opposite angles add to 180° · Tangent ⟂ radius · Tangents from a point are equal · Alternate segment theorem",
     ["Angle at the centre is twice the angle at the circumference.",
      "Angle in a semicircle is 90°.",
      "Angles in the same segment are equal (the 'bow-tie').",
      "Opposite angles of a cyclic quadrilateral add to 180°.",
      "A tangent meets a radius at 90°. Two tangents from the same point are equal in length.",
      "Alternate segment theorem: the angle between a tangent and a chord equals the angle in the opposite segment."],
     "Two radii make an isosceles triangle. That's often the hidden step.")

# ---------------- Vectors / transformations / congruence ----------------
card("Vectors", "OA = a and OB = b. M is the midpoint of AB. Find OM.",
     "OM = ½a + ½b",
     ["First find AB: go from A back to O (−a), then O to B (+b). So AB = b − a",
      "M is halfway along, so AM = ½(b − a)",
      "OM = OA + AM = a + ½(b − a) = a + ½b − ½a = ½a + ½b"],
     "Going against an arrow → minus that vector.")
card("Vectors", "OA = a and OB = b. P is on AB with AP : PB = 1 : 3. Find OP.",
     "OP = ¾a + ¼b",
     ["AB = b − a",
      "AP : PB = 1 : 3 means P is 1 part out of 4 along AB, so AP = ¼(b − a)",
      "OP = OA + AP = a + ¼(b − a) = a + ¼b − ¼a = ¾a + ¼b"],
     "Ratio 1 : 3 → that's 4 parts in total, so ¼ of the way along.")
card("Vectors", "How do you prove that three points A, B, C lie on a straight line?",
     "Show that AB and BC are multiples of each other (parallel) AND share the point B.",
     ["Find vector AB and vector BC in terms of a and b.",
      "Show that one is a multiple of the other, for example BC = 2AB. That means they are parallel.",
      "Because they also share the point B, A, B and C must be on one straight line.",
      "Write both reasons in your answer: 'parallel' and 'common point B'."],
     "")
card("Transformations", "Describe an enlargement with scale factor −2, centre (0, 0).",
     "The shape becomes 2 times bigger, appears on the OPPOSITE side of (0, 0), and is upside down.",
     ["Each new point is 2 times as far from the centre as the old one…",
      "…but in the opposite direction, because the scale factor is negative.",
      "Example: the point (1, 3) moves to (−2, −6)."],
     "'Describe fully' needs: enlargement, the scale factor, and the centre.")
card("Congruence", "What are the 4 conditions for proving two triangles are congruent?",
     "SSS, SAS, ASA (or AAS), RHS",
     ["SSS: all 3 sides are equal.",
      "SAS: 2 sides and the angle BETWEEN them are equal.",
      "ASA: 2 angles and a corresponding side are equal.",
      "RHS: a Right angle, the Hypotenuse, and one other Side are equal."],
     "AAA does NOT prove congruence: the triangles could be the same shape but a different size (similar).")

# ---------------- Probability ----------------
card("Probability", "A bag has 5 red and 3 green counters. Two are taken out without replacement. Find P(both the same colour).",
     "13/28",
     ["Without replacement, there is one fewer counter for the 2nd pick, so the bottom goes from 8 to 7.",
      "P(red, red) = 5/8 × 4/7 = 20/56",
      "P(green, green) = 3/8 × 2/7 = 6/56",
      "Same colour = red, red OR green, green, so ADD them: 20/56 + 6/56 = 26/56 = 13/28"],
     "Along the branches → multiply. Between routes → add.")
card("Probability", "The probability of rain on any day is 0.3. Find the probability that it rains on at least one of the next 2 days.",
     "0.51",
     ["'At least one' = 1 − P(none).",
      "P(no rain on one day) = 1 − 0.3 = 0.7",
      "P(no rain on both days) = 0.7 × 0.7 = 0.49",
      "P(at least one rainy day) = 1 − 0.49 = 0.51"],
     "'At least one' questions → always use 1 − P(none).")
card("Probability", "60 students: 35 like maths, 25 like science, and 10 like both. A student who likes science is picked. What is the probability they like maths?",
     "2/5",
     ["Fill in the Venn diagram: both = 10, maths only = 25, science only = 15, neither = 60 − 50 = 10.",
      "'Given they like science' means only look inside the science circle: 25 students.",
      "Of those 25, 10 like maths.",
      "P = 10/25 = 2/5"],
     "'Given that' → the bottom of the fraction becomes that group's total.")
card("Probability", "The probability of a biased dice landing on 6 is 0.15. It is rolled 200 times. How many 6s would you expect?",
     "30",
     ["Expected frequency = probability × number of trials",
      "0.15 × 200 = 30"],
     "")
card("Probability", "A coin lands on heads 34 times in 50 throws. Estimate P(heads). Is the coin fair?",
     "0.68. It may be biased, because a fair coin would give about 0.5.",
     ["Relative frequency = number of heads ÷ number of throws = 34 ÷ 50 = 0.68",
      "A fair coin would land on heads about half the time (0.5).",
      "0.68 is quite far from 0.5, so the coin might be biased.",
      "To be more sure, you would need MORE throws. More trials make the estimate more reliable."],
     "")

# ---------------- Statistics ----------------
card("Statistics", "Estimate the mean: 0 < t ≤ 10 (frequency 4), 10 < t ≤ 20 (7), 20 < t ≤ 30 (12), 30 < t ≤ 40 (7).",
     "22.3 (to 1 d.p.)",
     ["You don't know the exact values, so use the MIDPOINT of each group: 5, 15, 25, 35.",
      "Midpoint × frequency: 5×4 = 20, 15×7 = 105, 25×12 = 300, 35×7 = 245",
      "Total = 670. Total frequency = 4 + 7 + 12 + 7 = 30",
      "Mean ≈ 670 ÷ 30 = 22.3"],
     "It's an ESTIMATE, because you used midpoints instead of the real values.")
card("Statistics", "Class A (20 students) has a mean of 64. Class B (30 students) has a mean of 71. Find the mean of all 50 students.",
     "68.2",
     ["Total for A = 20 × 64 = 1280",
      "Total for B = 30 × 71 = 2130",
      "Overall total = 3410. Overall mean = 3410 ÷ 50 = 68.2"],
     "Don't just average 64 and 71. The classes are different sizes.")
card("Histograms", "A histogram bar has frequency density 1.6 and class width 15. What is the frequency?",
     "24",
     ["In a histogram, the AREA of a bar = the frequency.",
      "Frequency = frequency density × class width = 1.6 × 15 = 24"],
     "")
card("Histograms", "The group 20 < x ≤ 50 has a frequency of 45. What height (frequency density) should its bar be?",
     "1.5",
     ["Class width = 50 − 20 = 30",
      "Frequency density = frequency ÷ class width = 45 ÷ 30 = 1.5"],
     "The y-axis of a histogram is frequency density, not frequency.")
card("Statistics", "A cumulative frequency graph shows 80 people. How do you find the median and the interquartile range?",
     "Median: read across from 40. LQ: from 20. UQ: from 60. IQR = UQ − LQ.",
     ["Median = halfway: 80 ÷ 2 = 40. Go across from 40 to the curve, then down, and read the value.",
      "Lower quartile = a quarter of the way: 80 ÷ 4 = 20. Read across from 20.",
      "Upper quartile = three quarters: 60. Read across from 60.",
      "Interquartile range = UQ − LQ. This is the spread of the middle half of the data."],
     "Plot cumulative frequency at the END of each group.")
card("Statistics", "How do you compare two box plots (or two sets of data)?",
     "Compare an AVERAGE (the median) and a SPREAD (the IQR or range), and say what each means in context.",
     ["Average: 'Group A's median is higher, so on average Group A scored more.'",
      "Spread: 'Group A's IQR is smaller, so Group A's scores were more consistent.'",
      "Always use the real context words (scores, times, heights…)."],
     "Two comparisons = 2 marks. Numbers alone, without context, lose marks.")
card("Sampling", "40 fish are caught, marked and released. Later 50 fish are caught, and 8 of them are marked. Estimate the population.",
     "250 fish",
     ["The marked fish should be spread evenly through the lake.",
      "In the 2nd catch, 8 out of 50 are marked. So in the whole lake, 40 out of N are marked.",
      "8/50 = 40/N → N = 40 × 50 ÷ 8 = 250"],
     "Assumptions: the population doesn't change, and the marked fish mix in evenly.")
card("Statistics", "On a scatter graph, why is it unreliable to use the line of best fit far outside the data?",
     "That is extrapolation. The pattern may not continue outside the range of the data.",
     ["Interpolation = estimating INSIDE the range of the data. This is fairly reliable.",
      "Extrapolation = estimating OUTSIDE the range. This is unreliable.",
      "Also: correlation does not prove that one thing CAUSES the other."],
     "")

here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "flashcards.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Topic", "Question", "Answer", "Explanation", "Tip"])
    for c in C:
        w.writerow([c["t"], c["q"], c["a"], " | ".join(f"{i+1}. {s}" for i, s in enumerate(c["steps"])), c["tip"]])
with open(os.path.join(here, "flashcards-data.json"), "w", encoding="utf-8") as f:
    json.dump(C, f, ensure_ascii=False)
print(len(C), "cards")
