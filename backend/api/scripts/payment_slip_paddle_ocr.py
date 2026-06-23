#!/usr/bin/env python3

import json
import re
import sys

from paddleocr import PaddleOCR


def extract_labeled_value(lines: list[str], labels: list[str]) -> str | None:
    for line in lines:
        compact = re.sub(r"\s+", "", line)
        for label in labels:
            if label not in compact:
                continue

            match = re.search(re.escape(label) + r"[:：]?(.*)", compact)
            if not match:
                continue

            value = match.group(1).strip()
            if value:
                return value
    return None


def normalize_account(value: str | None) -> str | None:
    if not value:
        return None
    digits = re.sub(r"[^\d]", "", value)
    return digits or None


def normalize_amount(value: str | None) -> float | None:
    if not value:
        return None
    match = re.search(r"([0-9]{1,3}(?:[,，][0-9]{3})*(?:\.\d{1,2})|[0-9]+(?:\.\d{1,2})?)", value)
    if not match:
        return None
    try:
        return float(match.group(1).replace(",", "").replace("，", ""))
    except ValueError:
        return None


def normalize_currency(value: str | None) -> str | None:
    text = (value or "").upper()
    if "CNY" in text or "RMB" in text or "人民币" in (value or "") or "¥" in (value or ""):
        return "CNY"
    if "USD" in text or "$" in (value or ""):
        return "USD"
    if "EUR" in text or "€" in (value or ""):
        return "EUR"
    return None


def normalize_date(value: str | None) -> str | None:
    if not value:
        return None
    normalized = (
        value.replace("年", "-")
        .replace("月", "-")
        .replace("日", "")
        .replace("/", "-")
        .replace(".", "-")
    )
    match = re.search(r"(\d{4}-\d{1,2}-\d{1,2})", normalized)
    if not match:
        return None
    return f"{match.group(1)} 00:00"


def normalize_method(lines: list[str]) -> str | None:
    text = "\n".join(lines).upper()
    if "T/T" in text or "电汇" in text or "转账支出" in text:
        return "T/T"
    if "L/C" in text or "信用证" in text:
        return "L/C"
    return None


def build_extracted(lines: list[str]) -> dict:
    amount_line = extract_labeled_value(lines, ["金额", "交易金额", "付款金额"])
    return {
        "payerAccountNumber": normalize_account(extract_labeled_value(lines, ["付款人账号", "付款账号", "付款人账户", "付款账户"])),
        "payeeAccountNumber": normalize_account(extract_labeled_value(lines, ["收款人账号", "收款账号", "收款人账户", "收款账户"])),
        "payerName": extract_labeled_value(lines, ["付款人名称", "付款方名称"]),
        "payeeName": extract_labeled_value(lines, ["收款人名称", "收款方名称", "收款单位"]),
        "payerBankName": extract_labeled_value(lines, ["付款人开户行", "付款开户行"]),
        "payeeBankName": extract_labeled_value(lines, ["收款人开户行", "收款开户行"]),
        "amount": normalize_amount(amount_line),
        "currency": normalize_currency(amount_line),
        "paidAt": normalize_date(extract_labeled_value(lines, ["日期", "付款日期", "交易日期"])),
        "method": normalize_method(lines),
        "bankRef": extract_labeled_value(lines, ["交易流水号", "流水号", "回单号", "参考号"]),
    }


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing_image_path"}, ensure_ascii=False))
        return 1

    image_path = sys.argv[1]
    ocr = PaddleOCR(
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        lang="ch",
    )
    result = ocr.predict(image_path)

    lines = []
    scores = []
    for page in result:
        res = getattr(page, "json", {}) or {}
        page_res = res.get("res", {})
        page_lines = page_res.get("rec_texts", []) or []
        page_scores = page_res.get("rec_scores", []) or []
        lines.extend([str(line).strip() for line in page_lines if str(line).strip()])
        scores.extend([float(score) for score in page_scores if score is not None])

    confidence = round((sum(scores) / len(scores)) * 100, 2) if scores else None
    extracted = build_extracted(lines)
    print(
        json.dumps(
            {
                "text": "\n".join(lines),
                "lines": lines,
                "confidence": confidence,
                "extracted": extracted,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
