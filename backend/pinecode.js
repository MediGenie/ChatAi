const { Pinecone } = require("@pinecone-database/pinecone");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAI } = require("langchain/llms/openai");
const { loadQAStuffChain } = require("langchain/chains");
const { Document } = require("langchain/document");

const client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY, environment: process.env.PINECONE_ENVIRONMENT });


const createPineconeIndex = async (indexName, vectorDimension) => {
  // 1. Initiate index existence check
  console.log(`Checking "${indexName}"...`);
  // 2. Get list of existing indexes
  const existingIndexes = await client.listIndexes();

  // 3. If index doesn't exist, create it
  if (!existingIndexes.some(index => index.name === indexName)) {
    // 4. Log index creation initiation
    console.log(`Creating "${indexName}"...`);
    // 5. Create index
    const createClient = await client.createIndex({
      createRequest: {
        name: indexName,
        dimension: vectorDimension,
        metric: "cosine",
      },
    });
    // 6. Log successful creation
    console.log(`Created with client:`, createClient);
    // 7. Wait 60 seconds for index initialization
    await new Promise((resolve) => setTimeout(resolve, 60000));
  } else {
    // 8. Log if index already exists
    console.log(`"${indexName}" already exists.`);
  }
};

//---------------------------------------2nd file--------------------------------------------------

const updatePinecone = async (indexName, docs) => {

  // 3. Retrieve Pinecone index
  const index = client.Index(indexName);
  // 4. Log the retrieved index name

  const documents = await docs;

  // 5. Process each document in the docs array
  for (const doc of documents) {
    const txtPath = doc.metadata.source;
    const text = doc.pageContent;
    // 6. Create RecursiveCharacterTextSplitter instance 
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });

    // 7. Split text into chunks (documents) 
    const chunks = await textSplitter.createDocuments([text]);

    // 8. Create OpenAI embeddings for documents
    const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
      chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
    );

    // 9. Create and upsert vectors in batches of 100
    const batchSize = 100;

    let batch = [];

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const vector = {
        id: `${txtPath}_${idx}`,
        values: embeddingsArrays[idx],
        metadata: {
          ...chunk.metadata,
          loc: JSON.stringify(chunk.metadata.loc),
          pageContent: chunk.pageContent,
          txtPath: txtPath,
        },
      };

      batch.push(vector);

      // When batch is full or it's the last item, upsert the vectors

      if (batch.length === batchSize || idx === chunks.length - 1) {
        await index.upsert(batch);
        // Empty the batch
        batch = [];
      }
    }
  }
};


//---------------------------------------3rd  file--------------------------------------------------

const queryPineconeVectorStoreAndQueryLLM = async (
  indexName,
  question
) => {
  // 3. Start query process
  console.log("Querying Pinecone vector store...");
  // 4. Retrieve the Pinecone index
  const index = client.Index(indexName);

  // 5. Create query embedding
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);

  // 6. Query Pinecone index and return top 10 matches
  let queryResponse = await index.query({
    topK: 10,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true,
  });
  // 7. Log the number of matches
  console.log(`Found ${queryResponse.matches.length} matches...`);
  // 8. Log the question being asked
  console.log(`Asking question: ${question}...`);
  if (queryResponse.matches.length) {
    // 9. Create an OpenAI instance and load the QAStuffChain
    const llm = new OpenAI({});
    const chain = loadQAStuffChain(llm);
    // 10. Extract and concatenate page content from matched documents
    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.pageContent)
      .join(" ");
    // 11. Execute the chain with input documents and question
    const result = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question: question,
    });
    // 12. Log the answer
    return result.text
  } else {
    // 13. Log that there are no matches, so GPT-3 will not be queried
    console.log("Since there are no matches, GPT-3 will not be queried.");
  }
};


module.exports = {
  createPineconeIndex,
  updatePinecone,
  queryPineconeVectorStoreAndQueryLLM
}