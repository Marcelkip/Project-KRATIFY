CHART_IDS = [
    "tickets-over-period",
    "tickets-per-category",
    "tickets-by-entry-type",
    "tickets-by-location",
    "tickets-by-system-involved",
    "tickets-by-issue_type",
]

DEFAULT_EXTRA_RULES = [
    "Beschrijf trends formeel en feitelijk.",
    "Speculeer niet zonder duidelijke basis in de data.",
    "Noem alleen maatregelen die logisch aansluiten op de dominante patronen.",
    "Als een piek of patroon verwacht gedrag kan zijn, benoem dat expliciet.",
]

CHART_SPECIFIC_RULES = {
    "tickets-over-period": [
        "Let op piekdagen, opvallende dalingen en structurele patronen over tijd.",
        "Gebruik ticketinhoud op piekdagen om de mogelijke oorzaak te duiden."
    ],
    "tickets-per-category": [
        "Benoem categorieën met opvallend veel tickets en geef aan welke onderwerpen daarbinnen dominant zijn."
    ],
    "tickets-by-entry-type": [
        "Kijk of bepaalde binnenkomsttypes samenhangen met specifieke typen issues."
    ],
    "tickets-by-location": [
        "Kijk of bepaalde locaties disproportioneel veel tickets hebben en welke systemen of issue types daar domineren."
    ],
    "tickets-by-system-involved": [
        "Kijk welke systemen de grootste ticketdrivers zijn en welke issue types daarbij horen."
    ],
    "tickets-by-issue_type": [
        "Kijk welke issue types dominant zijn en met welke systemen of locaties ze samenhangen."
    ],
}

DATE_RANGES = [
    "Rond midden oktober tot eind oktober is er herfstvakantie; een verhoogd aantal tickets kan voorkomen door inlogproblemen en opstart na vakantie.",
    "Rond eind december tot begin januari is er kerstvakantie; vlak voor en na deze periode kan er een piek zijn in tickets door afsluitingen, resets en nieuwe sessies.",
    "Rond midden februari tot eind februari is er voorjaarsvakantie; na deze periode kan een lichte stijging in tickets voorkomen door gebruikers die weer inloggen.",
    "Rond eind april tot begin mei is er meivakantie; in deze periode en direct erna kunnen er meer tickets voorkomen rondom administratie, toegang en systemen.",
    "Rond de week vóór de meivakantie kan er al een lichte toename zijn in tickets door voorbereidingen en afrondingen.",
    "Rond midden juli tot eind augustus is er zomervakantie; vlak voor en vooral na deze periode kan een sterke piek voorkomen door accountproblemen, wachtwoorden en systeemtoegang.",
    "Direct na lange vakanties (met name zomervakantie en kerstvakantie) is het normaal dat er een duidelijke piek ontstaat in tickets gerelateerd aan authenticatie, accounts en toegang.",
    "Vlak vóór vakanties kan er een toename zijn in tickets door administratieve handelingen, afsluitingen en voorbereidingen.",
    "Tijdens vakanties zelf kan het aantal tickets dalen, maar specifieke issues zoals externe toegang of vergeten wachtwoorden kunnen relatief vaker voorkomen.",
    "Combinaties van locatie en systemen kunnen tijdens en na vakanties extra opvallen, bijvoorbeeld meerdere meldingen vanuit dezelfde locatie over login- of toegangssystemen."
]