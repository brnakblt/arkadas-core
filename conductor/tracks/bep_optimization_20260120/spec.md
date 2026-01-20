# Specification: Optimization of AI-Powered BEP Generation Flow

## 1. Overview
This track focuses on optimizing the AI-powered Individualized Education Program (BEP) generation feature within the dashboard. The goal is to improve the consistency, quality, and speed of the generated BEP documents by refining the interaction with the Google Gemini 2.0 Flash API and enhancing the frontend user experience.

## 2. Goals
- **Improve Consistency:** Ensure generated BEP content strictly adheres to the provided templates and educational standards.
- **Enhance Quality:** Refine prompt engineering to reduce hallucinations and ensure relevant, personalized educational goals.
- **Optimize UX:** Provide clearer feedback to users during the generation process (loading states, error handling) and allow for easy editing of generated drafts.
- **Performance:** Reduce latency in the generation process where possible.

## 3. Functional Requirements
- **Prompt Engineering:** Refactor the prompt construction logic to include specific constraints, few-shot examples, and strict formatting rules for the Gemini API.
- **Backend API:** Update the backend service (Next.js API route or Strapi controller) to handle the refined prompts and parse the AI response more robustly.
- **Frontend Dashboard:**
  - Update the BEP generation interface to allow users to input more specific student needs or focus areas before generation.
  - Display the generated content in an editable format (e.g., a rich text editor or structured form) for final review.
  - Implement robust error handling and "retry" functionality.
- **Template Management:** Create a mechanism to easily update or swap the underlying system prompts/templates used for generation.

## 4. Non-Functional Requirements
- **Latency:** The generation process should ideally complete within reasonable time limits (e.g., < 15 seconds), or provide progress updates.
- **Reliability:** The system should handle API rate limits and failures gracefully without crashing the UI.
- **Security:** Ensure no PII (Personally Identifiable Information) beyond what is strictly necessary is sent to the AI model, and that data transmission is encrypted.

## 5. Acceptance Criteria
- [ ] Users can successfully generate a BEP document for a selected student.
- [ ] The generated content follows the defined structure (Goals, Methods, Assessment) consistently.
- [ ] Users can edit the generated text and save it as a final BEP document.
- [ ] The system handles API errors gracefully and informs the user.
- [ ] Unit tests cover the prompt construction and response parsing logic.
