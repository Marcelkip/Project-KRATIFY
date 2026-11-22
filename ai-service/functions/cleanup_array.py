# Topdesk returns most data points a with name as key.
# This function makes the name the actual value instead of heaving to index name itself.
def cleanArray(data):
    if isinstance(data, dict):
        for key, value in list(data.items()):
            if isinstance(value, dict) and 'name' in value:
                data[key] = value['name']  # Replace nested dict with name value
            else:
                cleanArray(value)  # Recurse
    elif isinstance(data, list):
        for item in data:
            cleanArray(item)
    return data