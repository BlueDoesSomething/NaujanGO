"""Fast regression checks without loading the embedding model."""

import ast
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
source = ast.parse((ROOT / "scripts" / "chatbot_multilingual.py").read_text(encoding="utf-8"))
namespace = {"re": re}
names = {"_keyword_score", "keyword_fallback", "transport_intent", "get_response"}
for node in source.body:
    if isinstance(node, ast.Assign) and any(
        isinstance(target, ast.Name) and target.id == "KEYWORD_INTENT_MAP" for target in node.targets
    ):
        namespace["KEYWORD_INTENT_MAP"] = ast.literal_eval(node.value)
    if isinstance(node, ast.FunctionDef) and node.name in names:
        exec(compile(ast.Module(body=[node], type_ignores=[]), str(ROOT), "exec"), namespace)


class TransportRoutingTests(unittest.TestCase):
    def test_getting_around_uses_local_transport(self):
        for question in (
            "How do I get around Naujan? What are the transportation options available?",
            "What transportation options are available within Naujan?",
            "Can I take a tricycle in Naujan?",
        ):
            with self.subTest(question=question):
                self.assertEqual(namespace["transport_intent"](question.lower()), "Local_Transport")

    def test_arrival_is_not_local_transport(self):
        self.assertEqual(namespace["transport_intent"]("how to get to naujan from manila"), "Transportation_How_To_Get_There")
        self.assertIsNone(namespace["transport_intent"]("what can i eat in naujan?"))
        self.assertIsNone(namespace["transport_intent"]("comment aller à naujan", "fr"))

    def test_response_is_on_topic_and_not_the_fallback(self):
        responses = json.loads((ROOT / "models" / "intent_responses_en.json").read_text(encoding="utf-8"))
        namespace.update({
            "LANGUAGES": ["en"], "get_cache_key": lambda text, language: text,
            "normalize_input": lambda text, language: text.lower().replace("?", ""),
            "get_models": lambda language: (object(), object(), responses),
            "get_low_confidence_response": lambda language: "fallback",
            "response_cache": {},
        })
        answer = namespace["get_response"]("How do I get around Naujan? What are the transportation options available?")
        self.assertIn("tricycles", answer)
        self.assertIn("fare", answer)
        self.assertNotEqual(answer, "fallback")

    def test_keyword_matches_are_whole_words(self):
        self.assertIsNone(namespace["keyword_fallback"]("which"))


if __name__ == "__main__":
    unittest.main()
