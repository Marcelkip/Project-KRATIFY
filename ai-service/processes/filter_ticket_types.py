from processes.prompter import call_llama

def filterTicketType(text):
    prompt = f"""
    You are a security scrubber that has to check whether the following text is related to HR or trusted person matters.
    Do not include password inclusion as your decision, and also determine based on keywords alone, but on context and be 80% certain its HR related.
    If so please return the boolean value True.
    If not, return the boolean value False.

    DO NOT return any explanation, only the boolean value.

    Text:
    {text}

    Value:
    """

    returnValue = call_llama(prompt)
    if returnValue in ("True", "true", True):
        return True
    return False