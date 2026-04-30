import os
try:
    import torch
    from sentence_transformers import SentenceTransformer, util
    import torchvision.models as models
    import torchvision.transforms as transforms
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

from PIL import Image

# Define global variables for models
text_model = None
image_model = None
preprocess = None

if ML_AVAILABLE:
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
else:
    device = 'cpu'

def initialize_models():
    """Lazy loads machine learning models only if they aren't loaded yet."""
    global text_model, image_model, preprocess
    
    if not ML_AVAILABLE:
        # print("Machine learning dependencies not available. Matching features are disabled.")
        return
    
    if text_model is None:
        text_model = SentenceTransformer('all-MiniLM-L6-v2')
        
    if image_model is None:
        image_model = models.resnet50(pretrained=True)
        image_model.eval()
        if device == 'cuda':
            image_model.to('cuda')
            
    if preprocess is None:
        preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

def calculate_text_similarity(text1, text2):
    """Calculates cosine similarity between two text strings."""
    if not ML_AVAILABLE:
        return 0.0
    initialize_models()
    if not text1 or not text2:
        return 0.0
    embeddings1 = text_model.encode(text1, convert_to_tensor=True)
    embeddings2 = text_model.encode(text2, convert_to_tensor=True)
    cosine_scores = util.cos_sim(embeddings1, embeddings2)
    return cosine_scores.item()

def extract_image_features(image_path):
    """Extracts features from an image using pre-trained ResNet50."""
    if not ML_AVAILABLE:
        return None
    initialize_models()
    if not image_path or not os.path.exists(image_path):
        return None
    try:
        input_image = Image.open(image_path).convert('RGB')
        input_tensor = preprocess(input_image)
        input_batch = input_tensor.unsqueeze(0) 

        if device == 'cuda':
            input_batch = input_batch.to('cuda')

        with torch.no_grad():
            features = image_model(input_batch)
        
        return features.squeeze()
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return None

def calculate_image_similarity(features1, features2):
    """Calculates cosine similarity between two image feature vectors."""
    if features1 is None or features2 is None:
        return 0.0
    
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
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        lost_img_relative = lost_item.image_path.lstrip('/')
        found_img_relative = found_item.image_path.lstrip('/')
        
        lost_full_path = os.path.join(base_dir, lost_img_relative)
        found_full_path = os.path.join(base_dir, found_img_relative)
        
        lost_features = extract_image_features(lost_full_path)
        found_features = extract_image_features(found_full_path)
        
        if lost_features is not None and found_features is not None:
            image_score = calculate_image_similarity(lost_features, found_features)
            has_images = True
            
    if has_images:
        final_score = (text_score * 0.4) + (image_score * 0.6)
    else:
        final_score = text_score
        
    return {
        "score": final_score,
        "text_score": text_score,
        "image_score": image_score
    }
