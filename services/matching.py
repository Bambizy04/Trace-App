import os

# Initialize models (Mock structure)
def calculate_text_similarity(text1, text2):
    """Calculates mock similarity."""
    if not text1 or not text2:
        return 0.0
    text1_words = set(text1.lower().split())
    text2_words = set(text2.lower().split())
    intersection = text1_words.intersection(text2_words)
    union = text1_words.union(text2_words)
    return len(intersection) / len(union) if union else 0.0

def extract_image_features(image_path):
    """Mock feature extraction"""
    return [0.1, 0.2, 0.3]

def calculate_image_similarity(features1, features2):
    """Mock image similarity"""
    return 0.85

def calculate_text_similarity(text1, text2):
    """Calculates cosine similarity between two text strings."""
    if not text1 or not text2:
        return 0.0
    embeddings1 = text_model.encode(text1, convert_to_tensor=True)
    embeddings2 = text_model.encode(text2, convert_to_tensor=True)
    cosine_scores = util.cos_sim(embeddings1, embeddings2)
    return cosine_scores.item()

def extract_image_features(image_path):
    """Extracts features from an image using pre-trained ResNet."""
    if not image_path or not os.path.exists(image_path):
        return None
    try:
        input_image = Image.open(image_path).convert('RGB')
        input_tensor = preprocess(input_image)
        input_batch = input_tensor.unsqueeze(0) # create a mini-batch as expected by the model

        if torch.cuda.is_available():
            input_batch = input_batch.to('cuda')
            image_model.to('cuda')

        with torch.no_grad():
            features = image_model(input_batch)
        
        # Flatten the features
        return features.squeeze()
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return None

def calculate_image_similarity(features1, features2):
    """Calculates cosine similarity between two image feature vectors."""
    if features1 is None or features2 is None:
        return 0.0
    
    # Cosine similarity for 1D tensors
    cos = torch.nn.CosineSimilarity(dim=0, eps=1e-6)
    similarity = cos(features1, features2)
    return similarity.item()

def get_match_score(lost_item, found_item):
    """
    Computes an overall match score between a lost and found item.
    Combines text similarity (name + description) and image similarity if available.
    """
    lost_text = f"{lost_item.name} {lost_item.description}"
    found_text = f"{found_item.name} {found_item.description}"
    
    text_score = calculate_text_similarity(lost_text, found_text)
    
    image_score = 0.0
    has_images = False
    
    if lost_item.image_path and found_item.image_path:
        # Construct full paths (assuming standard local media setup for testing)
        # Note: image_path stored in DB usually looks like /static/uploads/...
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Strip leading slash if present to join correctly
        lost_img_relative = lost_item.image_path.lstrip('/')
        found_img_relative = found_item.image_path.lstrip('/')
        
        lost_full_path = os.path.join(base_dir, lost_img_relative)
        found_full_path = os.path.join(base_dir, found_img_relative)
        
        lost_features = extract_image_features(lost_full_path)
        found_features = extract_image_features(found_full_path)
        
        image_score = calculate_image_similarity(lost_features, found_features)
        has_images = True
        
    # Weighted score (e.g., 60% image, 40% text if both exist, otherwise 100% text)
    if has_images:
        final_score = (text_score * 0.4) + (image_score * 0.6)
    else:
        final_score = text_score
        
    return {
        "score": final_score,
        "text_score": text_score,
        "image_score": image_score
    }
