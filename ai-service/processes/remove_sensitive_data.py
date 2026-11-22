from processes.prompter import call_llama

FILTER_CONDITIONS = [
    "passwords",
    "emails",
    "names",
    "phone numbers",
    "credit card numbers",
    "API keys",
]

def removeSensitiveData(text):
    conditions = ", ".join(FILTER_CONDITIONS)
    prompt = f"""
    You are a security scrubber and you also filter text. Remove {conditions} and replace them with [SENSITIVE_DATA] and any text formatting strings like: \r \n <br> etc remove them. Keep the rest unchanged.

    Text:
    {text}

    Cleaned:
    """
    return call_llama(prompt)