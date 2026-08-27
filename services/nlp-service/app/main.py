from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas.query import ParseQueryRequest, StructuredQueryResponse
from .providers.llm_provider import LLMProviderFactory

app = FastAPI(
    title="SatQuery AI - NLP & Query Intelligence Service",
    description="Transforms natural language queries into structured Earth Observation search parameters.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "nlp-service",
        "version": "1.0.0"
    }

@app.post("/api/v1/nlp/parse", response_model=StructuredQueryResponse)
async def parse_query(request: ParseQueryRequest):
    if not request.raw_query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")
    
    provider = LLMProviderFactory.get_provider()
    structured = await provider.parse_query(request.raw_query)
    return structured
