from openai import OpenAI
import json
import logging

logger = logging.getLogger(__name__)

class LLMService:
  def __init__(self):
    self.client = OpenAI()

  def summarize(self, content: str) -> str:
    response = self.client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[
        {
          "role": "system",
          "content": "You are a helpful assistant that summarizes text clearly and concisely."
        },
        {
          "role": "user",
          "content": content
        }
      ],
      temperature=0.3
    )

    return response.choices[0].message.content.strip()

  def extract_structured_valuation(self, content: str) -> list[dict]:
    """
    Extract structured data from the report content 
    into a JSON format that matches the premium HTML valuation report schema.
    """
    schema_instructions = """
    Extract all relevant details from the provided land/property valuation document.
    You must return ONLY valid, strictly formatted JSON array containing the following sections, 
    matching exactly the keys and nested structures shown in this template below.
    If a specific data point is not found in the text, use "N/A" or 0 as appropriate for the data type.

    Expected JSON Schema Template:
    [
      {
        "section": "Property Details",
        "data": {
          "1": { "purpose_for_valuation": "..." },
          "2": { "a": { "date_of_inspection": "..." }, "b": { "date_on_which_valuation_is_made": "..." } },
          "3": { "documents_produced_for_perusal": [ { "document": "...", "details": "..." } ] },
          "4": { "name_of_owner": "..." },
          "5": { "name_of_applicant": "..." },
          "6": { "address_of_property": { "as_per_documents": "...", "as_per_actual_postal": "..." } },
          "7": { "deviations_if_any": "..." },
          "8": { "property_type": "..." },
          "9": { "property_zone": "..." },
          "10": { "classification_of_area": { "economic_class": "...", "area_type": "..." } },
          "11": { "coming_under": "..." },
          "12": { "covered_under_govt_enactments": "..." },
          "13": { "agricultural_land_conversion_contemplated": "..." },
          "14": { "boundaries_of_property": { "north": { "as_per_documents": "...", "as_per_site": "..." }, "south": { "as_per_documents": "...", "as_per_site": "..." }, "east": { "as_per_documents": "...", "as_per_site": "..." }, "west": { "as_per_documents": "...", "as_per_site": "..." }, "deviations_if_any": "..." } },
          "15": { "dimensions_of_site": { "north": { "as_per_actuals": "...", "as_per_documents": "...", "adopted_area_sft": "..." }, "south": { "as_per_actuals": "...", "as_per_documents": "...", "adopted_area_sft": "..." }, "east": { "as_per_actuals": "...", "as_per_documents": "...", "adopted_area_sft": "..." }, "west": { "as_per_actuals": "...", "as_per_documents": "...", "adopted_area_sft": "..." }, "total_area": { "as_per_actuals": "...", "as_per_documents": "...", "adopted_area_sft": "..." }, "deviations_if_any": "..." } },
          "16": { "latitude_longitude_coordinates_of_site": "..." },
          "17": { "demarcation": "..." },
          "18": { "occupancy_details": [ { "floor": "...", "occupancy": "...", "number_of_rooms": 0, "number_of_kitchen": 0, "number_of_bathroom": 0, "usage_remarks": "..." } ] },
          "19": { "type_of_road_available_at_present": "..." },
          "20": { "width_of_road_in_feet": "..." },
          "21": { "is_it_a_land_locked_land": "..." }
        }
      },
      {
        "section": "Part – A (Valuation of land)",
        "data": {
          "1": { "details": "Details", "land_area_in_sq_ft": "Land area in Sq Ft", "rate_per_sq_ft": "Rate per Sq ft", "value_in_rs": "Value in Rs." },
          "2": { "details": "Guideline rate obtained from the Registrar's Office", "land_area_in_sq_ft": "...", "rate_per_sq_ft": "...", "value_in_rs": "..." },
          "3": { "details": "Prevailing market value of the land", "land_area_in_sq_ft": "...", "rate_per_sq_ft": "...", "value_in_rs": "..." }
        }
      },
      {
        "section": "Part – B (Valuation of Building)",
        "technical_details": {
          "1": {
            "a": { "label": "Type of Building (Residential / Commercial / Industrial)", "value": "..." },
            "b": { "label": "Type of construction (Load bearing / RCC / Steel Framed)", "value": "..." },
            "c": { "label": "Age of the building", "value": "..." },
            "d": { "label": "Residual age of the building", "value": "..." },
            "e": { "label": "Approved map / plan issuing authority", "value": "..." },
            "f": { "label": "Whether genuineness or authenticity of approved map / plan is verified", "value": "..." },
            "g": { "label": "Any other comments by our empanelled valuers on authentic of approved plan", "value": "..." }
          }
        },
        "valuation_table": {
          "headers": {
            "sr_no": "Sr. no.",
            "particulars_of_item": "Particulars of item",
            "built_up_area": { "as_per_approved_plan_fsi": "As per Approved Plan/FSI", "as_per_actual": "As per Actual", "area_considered_for_the_valuation": "Area considered for the valuation" },
            "replacement_cost_of_construction": "Replacement cost of construction",
            "replacement_cost_in_rs": "Replacement cost in Rs.",
            "depreciation_in_rs": "Depreciation in Rs.",
            "net_value_after_depreciations_rs": "Net value after depreciations Rs."
          },
          "rows": [
            {
              "sr_no": 1,
              "particulars_of_item": "...",
              "built_up_area": { "as_per_approved_plan_fsi": 0, "as_per_actual": 0, "area_considered_for_the_valuation": 0 },
              "replacement_cost_of_construction": "...",
              "replacement_cost_in_rs": 0,
              "depreciation_in_rs": 0,
              "net_value_after_depreciations_rs": 0
            }
          ],
          "total": {
            "replacement_cost_in_rs": 0,
            "depreciation_in_rs": 0,
            "net_value_after_depreciations_rs": 0
          }
        }
      }
    ]
    """

    try:
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a specialized valuation data extraction assistant. You only output deeply nested raw structured JSON without formatting blocks like ```json."
                },
                {
                    "role": "user",
                    "content": f"{schema_instructions}\n\nDocument Text:\n{content}"
                }
            ],
            temperature=0.1
        )
        
        raw_output = response.choices[0].message.content.strip()
        
        # Guard against markdown code blocks
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:]
        if raw_output.startswith("```"):
            raw_output = raw_output[3:]
        if raw_output.endswith("```"):
            raw_output = raw_output[:-3]
            
        return json.loads(raw_output.strip())
        
    except Exception as e:
        logger.error(f"Failed to extract structured valuation: {str(e)}")
        # Return empty list on failure so caller knows it failed gracefully
        return []