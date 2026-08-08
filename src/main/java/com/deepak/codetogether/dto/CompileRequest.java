package com.deepak.codetogether.dto;

public class CompileRequest {
    private String code;
    private String language;
    private String stdin;

    private String input;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getStdin() {
        return stdin != null ? stdin : input;
    }

    public void setStdin(String stdin) {
        this.stdin = stdin;
    }

    public String getInput() {
        return input != null ? input : stdin;
    }

    public void setInput(String input) {
        this.input = input;
    }
}
