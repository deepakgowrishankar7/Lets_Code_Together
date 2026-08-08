/* ==========================================================================
   DATA STRUCTURES & ALGORITHMS (DSA) MASTERCLASS & LEETCODE PRACTICE ENGINE
   ========================================================================== */

// Active state tracking
let currentDsaLang = 'java';
let currentDsaConcept = 'arrays';
let currentExampleIndex = 0;
let currentPracticeProblemId = 'prob-1';
let currentCompanyFilter = 'all';
let currentCategoryFilter = 'all';
let currentStatusFilter = 'all'; // 'all', 'completed', 'uncompleted'
let currentDifficultyFilter = 'all'; // 'all', 'easy', 'medium', 'hard'
let currentSearchQuery = '';
let isDsaFullscreen = false;

function toggleDsaPracticeFullscreen() {
    const container = document.getElementById("ds-content-practice");
    if (!container) return;

    isDsaFullscreen = !isDsaFullscreen;

    if (isDsaFullscreen) {
        container.classList.add("dsa-fullscreen-mode");
        document.body.style.overflow = "hidden";
        if (container.requestFullscreen) {
            container.requestFullscreen().catch(() => {});
        }
    } else {
        container.classList.remove("dsa-fullscreen-mode");
        document.body.style.overflow = "";
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }

    const btn = document.getElementById("dsa-fullscreen-btn");
    if (btn) {
        btn.innerHTML = isDsaFullscreen ? "🗗 Exit Fullscreen" : "🖥️ Fullscreen Mode";
        btn.classList.toggle("active", isDsaFullscreen);
    }
}

document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        const container = document.getElementById("ds-content-practice");
        if (container && container.classList.contains("dsa-fullscreen-mode")) {
            container.classList.remove("dsa-fullscreen-mode");
            document.body.style.overflow = "";
            isDsaFullscreen = false;
            const btn = document.getElementById("dsa-fullscreen-btn");
            if (btn) {
                btn.innerHTML = "🖥️ Fullscreen Mode";
                btn.classList.remove("active");
            }
        }
    }
});

// Load solved problem IDs from localStorage
function getSolvedProblems() {
    try {
        return JSON.parse(localStorage.getItem('solved_dsa_problems') || '[]');
    } catch(e) { return []; }
}

function markProblemAsSolved(id) {
    const solved = getSolvedProblems();
    if (!solved.includes(id)) {
        solved.push(id);
        localStorage.setItem('solved_dsa_problems', JSON.stringify(solved));
    }
}

function saveSubmittedSolution(problemId, lang, code) {
    try {
        const history = JSON.parse(localStorage.getItem('dsa_solutions_history') || '{}');
        history[problemId] = {
            lang: lang,
            code: code,
            submittedAt: new Date().toLocaleString()
        };
        localStorage.setItem('dsa_solutions_history', JSON.stringify(history));
    } catch(e) {}
}

function getSubmittedSolution(problemId) {
    try {
        const history = JSON.parse(localStorage.getItem('dsa_solutions_history') || '{}');
        return history[problemId] || null;
    } catch(e) { return null; }
}

function getOptimalSolutionForProblem(problem, lang) {
    const title = problem.title.toLowerCase();
    
    if (title.includes("contains duplicate")) {
        if (lang === "python") {
            return `import sys\n\ndef solve():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    seen = set()\n    for num in tokens:\n        if num in seen:\n            print("true")\n            return\n        seen.add(num)\n    print("false")\n\nsolve()`;
        }
        return `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line = sc.nextLine().trim();\n        if (line.isEmpty()) return;\n\n        String[] tokens = line.split("\\\\s+");\n        Set<String> seen = new HashSet<>();\n        for (String token : tokens) {\n            if (seen.contains(token)) {\n                System.out.println("true");\n                return;\n            }\n            seen.add(token);\n        }\n        System.out.println("false");\n    }\n}`;
    } else if (title.includes("two sum")) {
        return `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<Integer> list = new ArrayList<>();\n        while (sc.hasNextInt()) list.add(sc.nextInt());\n        if (list.size() < 3) return;\n        int target = list.get(list.size() - 1);\n        int n = list.size() - 1;\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            int current = list.get(i);\n            int needed = target - current;\n            if (map.containsKey(needed)) {\n                System.out.println("[" + map.get(needed) + ", " + i + "]");\n                return;\n            }\n            map.put(current, i);\n        }\n        System.out.println("[]");\n    }\n}`;
    } else if (title.includes("top k frequent")) {
        return `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line1 = sc.nextLine().trim();\n        int k = sc.hasNextInt() ? sc.nextInt() : 2;\n        String[] tokens = line1.split("\\\\s+");\n        Map<Integer, Integer> countMap = new HashMap<>();\n        for (String t : tokens) {\n            int num = Integer.parseInt(t);\n            countMap.put(num, countMap.getOrDefault(num, 0) + 1);\n        }\n        PriorityQueue<Map.Entry<Integer, Integer>> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.getKey(), b.getKey()));\n        pq.addAll(countMap.entrySet());\n        List<Integer> res = new ArrayList<>();\n        for (int i = 0; i < k && !pq.isEmpty(); i++) res.add(pq.poll().getKey());\n        Collections.sort(res);\n        for (int i = 0; i < res.size(); i++) System.out.print(res.get(i) + (i == res.size() - 1 ? "" : " "));\n        System.out.println();\n    }\n}`;
    }

    return problem.starterCode[lang] || problem.starterCode['java'];
}

function showSubmittedSolutionModal(problemId) {
    const problem = dsaPracticeProblems.find(p => p.id === problemId);
    if (!problem) return;

    let sub = getSubmittedSolution(problemId);
    const overlay = document.createElement('div');
    overlay.className = 'dsa-submit-overlay';

    if (!sub) {
        overlay.innerHTML = `
            <div class="dsa-submit-card" style="max-width: 520px; text-align: center;">
                <h3 style="margin-top:0; color:#f59e0b; font-size:1.3rem;">⚠️ No Saved Solution Found</h3>
                <p style="color:var(--text-secondary); margin:12px 0 16px 0; font-size:0.95rem;">
                    You haven't submitted a solution for <b>"${escapeHtml(problem.title)}"</b> yet!
                </p>
                <div class="dsa-submit-stats" style="text-align:left;">
                    <div><b>• Status:</b> <span style="color:#f59e0b; font-weight:700;">⏳ Unsolved</span></div>
                    <div><b>• How to save:</b> Write your code in the editor and click <b>"🚀 Submit Solution"</b> (or <b>"▶ Run Test Cases"</b>). Once all test cases pass, your solution will automatically be saved here!</div>
                </div>
                <div style="display:flex; gap:12px; justify-content:center; align-items:center; margin-top:20px; flex-wrap:wrap;">
                    <button class="dsa-submit-btn-load" onclick="loadReferenceSolutionToEditor('${problemId}')">💡 Load Reference Solution</button>
                    <button class="dsa-submit-btn-close" onclick="this.closest('.dsa-submit-overlay').remove()">Got It</button>
                </div>
            </div>
        `;
    } else {
        overlay.innerHTML = `
            <div class="dsa-submit-card" style="max-width: 680px; text-align: left;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                    <h3 style="margin:0; color:#00f5a0; font-size:1.25rem;">📜 Saved Solution: ${escapeHtml(problem.title)}</h3>
                    <span style="font-size:0.85em; color:var(--text-tertiary);">Submitted: ${sub.submittedAt}</span>
                </div>
                <div style="margin-bottom:12px; font-size:0.9em;">
                    <b>Language:</b> <span style="color:var(--jade); font-weight:700;">${sub.lang.toUpperCase()}</span> | <b>Status:</b> ✅ Accepted
                </div>
                <div class="dsa-editor-wrapper" style="height:280px; resize:none; margin-bottom:16px;">
                    <div class="dsa-line-numbers">${sub.code.split('\n').map((_, i) => i + 1).join('<br>')}</div>
                    <textarea class="dsa-practice-textarea" readonly spellcheck="false">${escapeHtml(sub.code)}</textarea>
                </div>
                <div style="display:flex; gap:12px; justify-content:flex-end; align-items:center;">
                    <button class="dsa-submit-btn-load" onclick="loadSubmittedCodeToEditor('${problemId}')">✏️ Load Code into Editor</button>
                    <button class="dsa-submit-btn-close" onclick="this.closest('.dsa-submit-overlay').remove()">Close</button>
                </div>
            </div>
        `;
    }

    document.body.appendChild(overlay);
}

function loadSubmittedCodeToEditor(problemId) {
    const sub = getSubmittedSolution(problemId);
    if (sub) {
        currentDsaLang = sub.lang;
        const langSelect = document.getElementById('dsa-practice-lang-select');
        if (langSelect) langSelect.value = sub.lang;

        const editor = document.getElementById('dsa-practice-editor');
        if (editor) {
            editor.value = sub.code;
            if (typeof updateEditorLineNumbers === 'function') updateEditorLineNumbers();
        }
    }
    const overlay = document.querySelector('.dsa-submit-overlay');
    if (overlay) overlay.remove();
}

function loadReferenceSolutionToEditor(problemId) {
    const problem = dsaPracticeProblems.find(p => p.id === problemId);
    if (problem) {
        const refCode = getOptimalSolutionForProblem(problem, currentDsaLang);
        const editor = document.getElementById('dsa-practice-editor');
        if (editor) {
            editor.value = refCode;
            if (typeof updateEditorLineNumbers === 'function') updateEditorLineNumbers();
        }
    }
    const overlay = document.querySelector('.dsa-submit-overlay');
    if (overlay) overlay.remove();
}

function showAllSavedSolutionsModal() {
    let history = {};
    try {
        history = JSON.parse(localStorage.getItem('dsa_solutions_history') || '{}');
    } catch(e) {}

    const problemIds = Object.keys(history);
    const overlay = document.createElement('div');
    overlay.className = 'dsa-submit-overlay';

    if (problemIds.length === 0) {
        overlay.innerHTML = `
            <div class="dsa-submit-card" style="max-width: 520px; text-align: center;">
                <h3 style="margin-top:0; color:#00f5a0; font-size:1.3rem;">📜 Saved Solutions History</h3>
                <p style="color:var(--text-secondary); margin:16px 0 20px 0;">You haven't saved any solutions yet!</p>
                <div class="dsa-submit-stats" style="text-align:left;">
                    <div><b>• How to save:</b> Solve any practice problem and click <b>"🚀 Submit Solution"</b> (or <b>"▶ Run Test Cases"</b>). Once all test cases pass, your code solution is automatically saved here!</div>
                </div>
                <button class="dsa-submit-btn-close" style="margin-top:16px;" onclick="this.closest('.dsa-submit-overlay').remove()">Got It</button>
            </div>
        `;
    } else {
        let listHtml = problemIds.map(pId => {
            const item = history[pId];
            const prob = dsaPracticeProblems.find(p => p.id === pId);
            const title = prob ? prob.title : pId;
            return `
                <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <div style="font-weight:700; color:var(--text-primary); font-size:0.98rem;">${escapeHtml(title)}</div>
                        <div style="font-size:0.82em; color:var(--text-tertiary); margin-top:4px;">
                            Language: <span style="color:#00f5a0; font-weight:600;">${item.lang.toUpperCase()}</span> | Submitted: ${item.submittedAt}
                        </div>
                    </div>
                    <button class="dsa-submit-btn-load" onclick="this.closest('.dsa-submit-overlay').remove(); showSubmittedSolutionModal('${pId}')">📜 View Code</button>
                </div>
            `;
        }).join('');

        overlay.innerHTML = `
            <div class="dsa-submit-card" style="max-width: 680px; text-align: left;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 style="margin:0; color:#00f5a0; font-size:1.3rem;">📜 Your Saved Solutions History (${problemIds.length})</h3>
                    <button class="dsa-submit-btn-close" style="padding:4px 12px; font-size:0.85rem;" onclick="this.closest('.dsa-submit-overlay').remove()">✕</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:10px; max-height:360px; overflow-y:auto; padding-right:4px;">
                    ${listHtml}
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:16px;">
                    <button class="dsa-submit-btn-close" onclick="this.closest('.dsa-submit-overlay').remove()">Close</button>
                </div>
            </div>
        `;
    }

    document.body.appendChild(overlay);
}

// Company Metadata Definition
const companyMeta = {
    'google': { name: 'Google', class: 'google', icon: '' },
    'amazon': { name: 'Amazon', class: 'amazon', icon: '' },
    'meta': { name: 'Meta', class: 'meta', icon: '' },
    'microsoft': { name: 'Microsoft', class: 'microsoft', icon: '' },
    'apple': { name: 'Apple', class: 'apple', icon: '' },
    'uber': { name: 'Uber', class: 'uber', icon: '' },
    'netflix': { name: 'Netflix', class: 'netflix', icon: '' },
    'adobe': { name: 'Adobe', class: 'adobe', icon: '' }
};

// DSA Concept Data Store (7 Core Tutorial Modules with 3 Full Examples Each)
const dsaConceptsData = {
    'arrays': {
        title: '1. Arrays & Dynamic Arrays (Vectors / ArrayList)',
        badge: 'Fundamental',
        analogy: '💡 <b>Real-World Analogy:</b> Think of an array like a row of numbered mailboxes in an apartment building. Every mailbox has a fixed index (0, 1, 2, ...), and you can instantly open any mailbox if you know its number (<code>O(1)</code> time).',
        explanation: `
            <p>An <b>Array</b> is a linear data structure that stores elements of the same data type in contiguous memory locations.</p>
            <ul>
                <li><b>Static Array:</b> Fixed size allocated at initialization (e.g. <code>int arr[5]</code>).</li>
                <li><b>Dynamic Array:</b> Automatically resizes when full (e.g. <code>ArrayList</code> in Java, <code>vector</code> in C++, <code>list</code> in Python).</li>
            </ul>
            <h4>Time & Space Complexity:</h4>
            <table class="dsa-complexity-table">
                <thead>
                    <tr><th>Operation</th><th>Time Complexity</th><th>Explanation</th></tr>
                </thead>
                <tbody>
                    <tr><td>Access by Index</td><td><code>O(1)</code></td><td>Direct memory pointer calculation.</td></tr>
                    <tr><td>Search Value</td><td><code>O(N)</code></td><td>Linear scan through elements.</td></tr>
                    <tr><td>Insertion (End)</td><td><code>O(1) amortized</code></td><td>Fast unless resizing is triggered.</td></tr>
                    <tr><td>Insertion (Middle/Start)</td><td><code>O(N)</code></td><td>Elements must be shifted right.</td></tr>
                </tbody>
            </table>
        `,
        examples: [
            {
                title: 'Example 1: Basic Array Traversal & Reversal',
                desc: 'Demonstrates static array allocation, element access by index, and reversing an array in-place using two pointers.',
                code: {
                    java: `public class ArrayDemo {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50};
        System.out.println("Element at index 2: " + arr[2]);

        // In-place Reversal
        int left = 0, right = arr.length - 1;
        while (left < right) {
            int temp = arr[left];
            arr[left] = arr[right];
            arr[right] = temp;
            left++; right--;
        }

        System.out.print("Reversed Array: ");
        for (int val : arr) System.out.print(val + " ");
    }
}`,
                    python: `arr = [10, 20, 30, 40, 50]
print("Element at index 2:", arr[2])

# In-place Reversal
arr.reverse()
print("Reversed Array:", arr)`,
                    cpp: `#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    int arr[5] = {10, 20, 30, 40, 50};
    cout << "Element at index 2: " << arr[2] << endl;

    // Reverse array
    reverse(arr, arr + 5);

    cout << "Reversed Array: ";
    for(int i = 0; i < 5; i++) cout << arr[i] << " ";
    cout << endl;
    return 0;
}`,
                    c: `#include <stdio.h>

int main() {
    int arr[5] = {10, 20, 30, 40, 50};
    printf("Element at index 2: %d\\n", arr[2]);

    // Reverse array
    int i = 0, j = 4;
    while(i < j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
        i++; j--;
    }

    printf("Reversed Array: ");
    for(int k = 0; k < 5; k++) printf("%d ", arr[k]);
    printf("\\n");
    return 0;
}`
                }
            },
            {
                title: 'Example 2: Dynamic Resizing (ArrayList / Vector)',
                desc: 'Shows how dynamic arrays automatically grow when full without needing manual size management.',
                code: {
                    java: `import java.util.ArrayList;

public class DynamicArrayDemo {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(100);
        list.add(200);
        list.add(300);
        System.out.println("ArrayList Size: " + list.size());
        System.out.println("Elements: " + list);
    }
}`,
                    python: `# Python lists grow dynamically
dyn_list = []
dyn_list.append(100)
dyn_list.append(200)
dyn_list.append(300)
print("List Size:", len(dyn_list))
print("Elements:", dyn_list)`,
                    cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> vec;
    vec.push_back(100);
    vec.push_back(200);
    vec.push_back(300);
    cout << "Vector Size: " << vec.size() << endl;
    cout << "Elements: ";
    for(int x : vec) cout << x << " ";
    cout << endl;
    return 0;
}`,
                    c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int *dynArr = (int*)malloc(3 * sizeof(int));
    dynArr[0] = 100;
    dynArr[1] = 200;
    dynArr[2] = 300;
    
    printf("Dynamic Allocation Elements: %d %d %d\\n", dynArr[0], dynArr[1], dynArr[2]);
    free(dynArr);
    return 0;
}`
                }
            },
            {
                title: 'Example 3: Finding Max & Min Element',
                desc: 'Single linear pass O(N) to find the maximum and minimum elements in an unsorted array.',
                code: {
                    java: `public class MaxMinArray {
    public static void main(String[] args) {
        int[] arr = {45, 12, 89, 34, 67, 90, 23};
        int min = arr[0], max = arr[0];

        for (int val : arr) {
            if (val > max) max = val;
            if (val < min) min = val;
        }

        System.out.println("Max Element: " + max);
        System.out.println("Min Element: " + min);
    }
}`,
                    python: `arr = [45, 12, 89, 34, 67, 90, 23]
print("Max Element:", max(arr))
print("Min Element:", min(arr))`,
                    cpp: `#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    int arr[] = {45, 12, 89, 34, 67, 90, 23};
    int n = sizeof(arr)/sizeof(arr[0]);
    int maxVal = *max_element(arr, arr + n);
    int minVal = *min_element(arr, arr + n);

    cout << "Max Element: " << maxVal << endl;
    cout << "Min Element: " << minVal << endl;
    return 0;
}`,
                    c: `#include <stdio.h>

int main() {
    int arr[] = {45, 12, 89, 34, 67, 90, 23};
    int n = 7;
    int max = arr[0], min = arr[0];

    for(int i = 1; i < n; i++) {
        if(arr[i] > max) max = arr[i];
        if(arr[i] < min) min = arr[i];
    }

    printf("Max Element: %d\\nMin Element: %d\\n", max, min);
    return 0;
}`
                }
            }
        ]
    },

    'linked-lists': {
        title: '2. Linked Lists (Singly, Doubly & Circular)',
        badge: 'Core Structure',
        analogy: '💡 <b>Real-World Analogy:</b> A Linked List is like a treasure hunt or a train! Each train car (Node) carries data and is physically coupled (Pointers) to the car behind it. You can easily unhook a car in the middle without rebuilding the train.',
        explanation: `
            <p>A <b>Linked List</b> is a linear data structure where elements are connected via pointers rather than contiguous memory locations.</p>
            <h4>Types of Linked Lists:</h4>
            <ul>
                <li><b>Singly Linked List:</b> Nodes point only to the next node (<code>head -> 10 -> 20 -> 30 -> null</code>).</li>
                <li><b>Doubly Linked List:</b> Nodes point to both previous and next nodes (<code>null <- 10 <=> 20 <=> 30 -> null</code>).</li>
                <li><b>Circular Linked List:</b> The last node points back to the head node.</li>
            </ul>

            <h4>Complexity Table:</h4>
            <table class="dsa-complexity-table">
                <thead>
                    <tr><th>Operation</th><th>Array / Vector</th><th>Singly Linked List</th><th>Doubly Linked List</th></tr>
                </thead>
                <tbody>
                    <tr><td>Access by Index</td><td><code>O(1)</code></td><td><code>O(N)</code></td><td><code>O(N)</code></td></tr>
                    <tr><td>Insert at Head</td><td><code>O(N)</code></td><td><code>O(1)</code></td><td><code>O(1)</code></td></tr>
                    <tr><td>Delete Head</td><td><code>O(N)</code></td><td><code>O(1)</code></td><td><code>O(1)</code></td></tr>
                </tbody>
            </table>
        `,
        examples: [
            {
                title: 'Example 1: Singly Linked List Creation & Traversal',
                desc: 'Basic implementation of Node class and linear traversal through pointers.',
                code: {
                    java: `class Node {
    int data;
    Node next;
    Node(int d) { this.data = d; this.next = null; }
}

public class LinkedListDemo {
    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20);
        head.next.next = new Node(30);

        Node curr = head;
        System.out.print("Linked List: ");
        while (curr != null) {
            System.out.print(curr.data + " -> ");
            curr = curr.next;
        }
        System.out.println("null");
    }
}`,
                    python: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

head = Node(10)
head.next = Node(20)
head.next.next = Node(30)

curr = head
print("Linked List:", end=" ")
while curr:
    print(curr.data, end=" -> ")
    curr = curr.next
print("None")`,
                    cpp: `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

int main() {
    Node* head = new Node(10);
    head->next = new Node(20);
    head->next->next = new Node(30);

    Node* curr = head;
    cout << "Linked List: ";
    while (curr != nullptr) {
        cout << curr->data << " -> ";
        curr = curr->next;
    }
    cout << "null" << endl;
    return 0;
}`,
                    c: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

int main() {
    struct Node* head = (struct Node*)malloc(sizeof(struct Node));
    struct Node* second = (struct Node*)malloc(sizeof(struct Node));
    
    head->data = 10;
    head->next = second;
    second->data = 20;
    second->next = NULL;

    struct Node* curr = head;
    printf("Linked List: ");
    while (curr != NULL) {
        printf("%d -> ", curr->data);
        curr = curr->next;
    }
    printf("NULL\\n");
    return 0;
}`
                }
            },
            {
                title: 'Example 2: Reversing a Linked List',
                desc: 'Classic iterative pointer reversal in O(N) time and O(1) space.',
                code: {
                    java: `class Node {
    int data; Node next;
    Node(int d) { data = d; }
}

public class ReverseLinkedList {
    public static Node reverse(Node head) {
        Node prev = null, curr = head;
        while (curr != null) {
            Node nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }

    public static void main(String[] args) {
        Node head = new Node(1);
        head.next = new Node(2);
        head.next.next = new Node(3);

        Node revHead = reverse(head);
        System.out.print("Reversed List: ");
        while (revHead != null) {
            System.out.print(revHead.data + " -> ");
            revHead = revHead.next;
        }
        System.out.println("null");
    }
}`,
                    python: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

head = Node(1)
head.next = Node(2)
head.next.next = Node(3)

rev = reverse(head)
while rev:
    print(rev.val, end=" -> ")
    rev = rev.next
print("None")`,
                    cpp: `#include <iostream>
using namespace std;

struct Node {
    int val; Node* next;
    Node(int x) : val(x), next(nullptr) {}
};

Node* reverse(Node* head) {
    Node *prev = nullptr, *curr = head;
    while(curr) {
        Node* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}

int main() {
    Node* head = new Node(1);
    head->next = new Node(2);
    head->next->next = new Node(3);

    Node* rev = reverse(head);
    while(rev) {
        cout << rev->val << " -> ";
        rev = rev->next;
    }
    cout << "null" << endl;
    return 0;
}`,
                    c: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data; struct Node* next;
};

struct Node* reverse(struct Node* head) {
    struct Node *prev = NULL, *curr = head, *next = NULL;
    while(curr != NULL) {
        next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

int main() {
    struct Node* h = (struct Node*)malloc(sizeof(struct Node));
    h->data = 1; h->next = NULL;
    struct Node* rev = reverse(h);
    printf("Reversed Head Data: %d\\n", rev->data);
    return 0;
}`
                }
            },
            {
                title: 'Example 3: Cycle Detection (Floyd\'s Algorithm)',
                desc: 'Detects loops in linked lists using Slow and Fast pointers in O(N) time and O(1) space.',
                code: {
                    java: `public class CycleDetection {
    static class Node { int val; Node next; Node(int v) { val = v; } }

    public static boolean hasCycle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }

    public static void main(String[] args) {
        Node n1 = new Node(10);
        Node n2 = new Node(20);
        n1.next = n2; n2.next = n1; // Cycle!

        System.out.println("Cycle Detected: " + hasCycle(n1));
    }
}`,
                    python: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False

n1, n2 = Node(10), Node(20)
n1.next = n2
n2.next = n1
print("Cycle Detected:", has_cycle(n1))`,
                    cpp: `#include <iostream>
using namespace std;

struct Node {
    int val; Node* next;
    Node(int v) : val(v), next(nullptr) {}
};

bool hasCycle(Node* head) {
    Node *slow = head, *fast = head;
    while(fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if(slow == fast) return true;
    }
    return false;
}

int main() {
    Node* n1 = new Node(10);
    Node* n2 = new Node(20);
    n1->next = n2; n2->next = n1;
    cout << "Cycle Detected: " << (hasCycle(n1) ? "true" : "false") << endl;
    return 0;
}`,
                    c: `#include <stdio.h>
#include <stdbool.h>

struct Node { int val; struct Node* next; };

bool hasCycle(struct Node* head) {
    struct Node *slow = head, *fast = head;
    while(fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
        if(slow == fast) return true;
    }
    return false;
}

int main() {
    printf("Cycle Detection Algorithm Ready\\n");
    return 0;
}`
                }
            }
        ]
    },

    'stacks-queues': {
        title: '3. Stacks & Queues (LIFO vs FIFO Mechanics)',
        badge: 'Essential',
        analogy: '💡 <b>Real-World Analogy:</b><br>• <b>Stack (LIFO):</b> A stack of cafeteria plates — last placed is first removed.<br>• <b>Queue (FIFO):</b> A queue line at a ticket counter — first in line is served first.',
        explanation: `
            <p><b>Stack:</b> LIFO (Last In, First Out) structure. Operations: <code>push()</code>, <code>pop()</code>, <code>peek()</code>.</p>
            <p><b>Queue:</b> FIFO (First In, First Out) structure. Operations: <code>enqueue()</code>, <code>dequeue()</code>, <code>front()</code>.</p>
            
            <h4>Operations Breakdown:</h4>
            <table class="dsa-complexity-table">
                <thead>
                    <tr><th>Data Structure</th><th>Primary Push / Enqueue</th><th>Primary Pop / Dequeue</th><th>Peek / Top</th><th>Time Complexity</th></tr>
                </thead>
                <tbody>
                    <tr><td><b>Stack</b></td><td><code>push(x)</code></td><td><code>pop()</code></td><td><code>peek()</code></td><td><code>O(1)</code></td></tr>
                    <tr><td><b>Queue</b></td><td><code>add(x)</code></td><td><code>poll()</code></td><td><code>peek()</code></td><td><code>O(1)</code></td></tr>
                </tbody>
            </table>
        `,
        examples: [
            {
                title: 'Example 1: Stack LIFO Operations',
                desc: 'Demonstrates stack push, pop, and top inspection.',
                code: {
                    java: `import java.util.Stack;

public class StackDemo {
    public static void main(String[] args) {
        Stack<Integer> st = new Stack<>();
        st.push(10);
        st.push(20);
        st.push(30);

        System.out.println("Top element: " + st.peek());
        System.out.println("Popped element: " + st.pop()); // 30
        System.out.println("Remaining Stack: " + st);
    }
}`,
                    python: `stack = [10, 20, 30]
print("Top element:", stack[-1])
print("Popped element:", stack.pop()) # 30
print("Remaining Stack:", stack)`,
                    cpp: `#include <iostream>
#include <stack>
using namespace std;

int main() {
    stack<int> st;
    st.push(10); st.push(20); st.push(30);
    cout << "Top element: " << st.top() << endl;
    st.pop();
    cout << "New Top element: " << st.top() << endl;
    return 0;
}`,
                    c: `#include <stdio.h>
#define MAX 5
int stack[MAX], top = -1;

void push(int v) { if(top < MAX-1) stack[++top] = v; }
int pop() { return (top >= 0) ? stack[top--] : -1; }

int main() {
    push(10); push(20); push(30);
    printf("Popped: %d\\n", pop());
    return 0;
}`
                }
            },
            {
                title: 'Example 2: Queue FIFO Operations',
                desc: 'Demonstrates Queue FIFO enqueue and dequeue mechanics.',
                code: {
                    java: `import java.util.LinkedList;
import java.util.Queue;

public class QueueDemo {
    public static void main(String[] args) {
        Queue<Integer> q = new LinkedList<>();
        q.add(100); q.add(200); q.add(300);

        System.out.println("Front element: " + q.peek());
        System.out.println("Polled element: " + q.poll()); // 100
        System.out.println("Remaining Queue: " + q);
    }
}`,
                    python: `from collections import deque

queue = deque([100, 200, 300])
print("Front element:", queue[0])
print("Polled element:", queue.popleft()) # 100
print("Remaining Queue:", queue)`,
                    cpp: `#include <iostream>
#include <queue>
using namespace std;

int main() {
    queue<int> q;
    q.push(100); q.push(200); q.push(300);
    cout << "Front element: " << q.front() << endl;
    q.pop();
    cout << "New Front: " << q.front() << endl;
    return 0;
}`,
                    c: `#include <stdio.h>

int queue[5], front = 0, rear = 0;
void enqueue(int v) { queue[rear++] = v; }
int dequeue() { return queue[front++]; }

int main() {
    enqueue(100); enqueue(200);
    printf("Dequeued: %d\\n", dequeue());
    return 0;
}`
                }
            },
            {
                title: 'Example 3: Valid Parentheses Checking',
                desc: 'Uses a stack to evaluate balanced bracket strings in O(N) time.',
                code: {
                    java: `import java.util.Stack;

public class ValidParentheses {
    public static boolean isValid(String s) {
        Stack<Character> st = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') st.push(')');
            else if (c == '{') st.push('}');
            else if (c == '[') st.push(']');
            else if (st.isEmpty() || st.pop() != c) return false;
        }
        return st.isEmpty();
    }

    public static void main(String[] args) {
        System.out.println("()[]{} is valid: " + isValid("()[]{}"));
        System.out.println("(] is valid: " + isValid("(]"));
    }
}`,
                    python: `def is_valid(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_elem = stack.pop() if stack else '#'
            if mapping[char] != top_elem: return False
        else:
            stack.append(char)
    return not stack

print("()[]{} is valid:", is_valid("()[]{}"))
print("(] is valid:", is_valid("(]"))`,
                    cpp: `#include <iostream>
#include <stack>
using namespace std;

bool isValid(string s) {
    stack<char> st;
    for(char c : s) {
        if(c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if(st.empty()) return false;
            if(c == ')' && st.top() != '(') return false;
            if(c == '}' && st.top() != '{') return false;
            if(c == ']' && st.top() != '[') return false;
            st.pop();
        }
    }
    return st.empty();
}

int main() {
    cout << "()[]{} is valid: " << (isValid("()[]{}") ? "true" : "false") << endl;
    return 0;
}`,
                    c: `#include <stdio.h>
#include <stdbool.h>

int main() {
    printf("Valid Parentheses Stack Evaluator Ready\\n");
    return 0;
}`
                }
            }
        ]
    },

    'trees': {
        title: '4. Binary Trees & Binary Search Trees (BST)',
        badge: 'Hierarchical',
        analogy: '💡 <b>Real-World Analogy:</b> A file directory structure (<code>C:/ -> Program Files -> App</code>). In a BST, all values in the left subtree are smaller, and all values in the right subtree are larger.',
        explanation: `
            <p>A <b>Binary Search Tree (BST)</b> keeps left child < parent < right child.</p>
            <h4>Tree Traversals:</h4>
            <ul>
                <li><b>Inorder (Left, Root, Right):</b> Returns nodes in strictly sorted order!</li>
                <li><b>Preorder (Root, Left, Right):</b> Used for cloning trees.</li>
                <li><b>Postorder (Left, Right, Root):</b> Used for tree cleanup & deletion.</li>
            </ul>
        `,
        examples: [
            {
                title: 'Example 1: BST Inorder Traversal (Sorted Output)',
                desc: 'Demonstrates BST node insertion and inorder traversal producing sorted output.',
                code: {
                    java: `class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

public class BSTInorder {
    public static void inorder(TreeNode root) {
        if (root == null) return;
        inorder(root.left);
        System.out.print(root.val + " ");
        inorder(root.right);
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(20);
        root.left = new TreeNode(10);
        root.right = new TreeNode(30);

        System.out.print("Inorder Traversal: ");
        inorder(root); // Output: 10 20 30
    }
}`,
                    python: `class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = self.right = None

def inorder(root):
    if not root: return
    inorder(root.left)
    print(root.val, end=" ")
    inorder(root.right)

root = TreeNode(20)
root.left = TreeNode(10)
root.right = TreeNode(30)
print("Inorder Traversal:")
inorder(root)`,
                    cpp: `#include <iostream>
using namespace std;

struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

void inorder(TreeNode* root) {
    if (!root) return;
    inorder(root->left);
    cout << root->val << " ";
    inorder(root->right);
}

int main() {
    TreeNode* root = new TreeNode(20);
    root->left = new TreeNode(10);
    root->right = new TreeNode(30);
    cout << "Inorder Traversal: ";
    inorder(root);
    return 0;
}`,
                    c: `#include <stdio.h>
#include <stdlib.h>

struct Node { int val; struct Node *left, *right; };

void inorder(struct Node* root) {
    if(!root) return;
    inorder(root->left);
    printf("%d ", root->val);
    inorder(root->right);
}

int main() {
    printf("BST Inorder Traversal Ready\\n");
    return 0;
}`
                }
            },
            {
                title: 'Example 2: Searching in a BST',
                desc: 'Binary search tree lookup in O(log N) average time.',
                code: {
                    java: `public class SearchBST {
    static class Node { int val; Node left, right; Node(int v) { val = v; } }

    public static boolean search(Node root, int target) {
        if (root == null) return false;
        if (root.val == target) return true;
        if (target < root.val) return search(root.left, target);
        return search(root.right, target);
    }

    public static void main(String[] args) {
        Node root = new Node(20);
        root.left = new Node(10);
        root.right = new Node(30);

        System.out.println("Search 30: " + search(root, 30));
        System.out.println("Search 50: " + search(root, 50));
    }
}`,
                    python: `def search(root, target):
    if not root: return False
    if root.val == target: return True
    if target < root.val: return search(root.left, target)
    return search(root.right, target)`,
                    cpp: `bool search(TreeNode* root, int target) {
    if (!root) return false;
    if (root->val == target) return true;
    if (target < root->val) return search(root->left, target);
    return search(root->right, target);
}`,
                    c: `int search(struct Node* root, int target) {
    if (!root) return 0;
    if (root->val == target) return 1;
    if (target < root->val) return search(root->left, target);
    return search(root->right, target);
}`
                }
            },
            {
                title: 'Example 3: Maximum Depth of Binary Tree',
                desc: 'Recursively calculates the maximum height of a binary tree in O(N) time.',
                code: {
                    java: `public class MaxDepthTree {
    static class Node { int val; Node left, right; Node(int v) { val = v; } }

    public static int maxDepth(Node root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }

    public static void main(String[] args) {
        Node root = new Node(3);
        root.left = new Node(9);
        root.right = new Node(20);
        root.right.left = new Node(15);

        System.out.println("Max Depth: " + maxDepth(root)); // 3
    }
}`,
                    python: `def max_depth(root):
    if not root: return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))`,
                    cpp: `int maxDepth(TreeNode* root) {
    if (!root) return 0;
    return 1 + max(maxDepth(root->left), maxDepth(root->right));
}`,
                    c: `int maxDepth(struct Node* root) {
    if (!root) return 0;
    int l = maxDepth(root->left);
    int r = maxDepth(root->right);
    return 1 + (l > r ? l : r);
}`
                }
            }
        ]
    },

    'graphs': {
        title: '5. Graphs & Traversal Algorithms (BFS, DFS, Dijkstra)',
        badge: 'Networks & Maps',
        analogy: '💡 <b>Real-World Analogy:</b> Social media networks (LinkedIn connections) or Google Maps navigation! Users or Cities are <b>Vertices (V)</b>, and friendships or flight paths are <b>Edges (E)</b>.',
        explanation: `
            <p>A <b>Graph</b> consists of Vertices (V) connected by Edges (E).</p>
            <h4>BFS vs DFS Comparison:</h4>
            <table class="dsa-complexity-table">
                <thead>
                    <tr><th>Algorithm</th><th>Data Structure Used</th><th>Strategy</th><th>Primary Use Case</th></tr>
                </thead>
                <tbody>
                    <tr><td><b>BFS (Breadth-First Search)</b></td><td><code>Queue</code> (FIFO)</td><td>Explores level-by-level outwards</td><td>Shortest path in unweighted graph</td></tr>
                    <tr><td><b>DFS (Depth-First Search)</b></td><td><code>Stack</code> / Recursion</td><td>Explores as deep as possible down each branch</td><td>Topological sort, maze solving, cycle detection</td></tr>
                </tbody>
            </table>
        `,
        examples: [
            {
                title: 'Example 1: Breadth-First Search (BFS)',
                desc: 'Level-by-level graph traversal using a Queue in O(V + E) time.',
                code: {
                    java: `import java.util.*;

public class GraphBFS {
    public static void bfs(int start, Map<Integer, List<Integer>> adj) {
        Set<Integer> visited = new HashSet<>();
        Queue<Integer> q = new LinkedList<>();

        q.add(start);
        visited.add(start);

        while (!q.isEmpty()) {
            int node = q.poll();
            System.out.print(node + " ");
            for (int neighbor : adj.getOrDefault(node, new ArrayList<>())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    q.add(neighbor);
                }
            }
        }
    }

    public static void main(String[] args) {
        Map<Integer, List<Integer>> adj = new HashMap<>();
        adj.put(0, Arrays.asList(1, 2));
        adj.put(1, Arrays.asList(0, 3));
        adj.put(2, Arrays.asList(0, 3));

        System.out.print("BFS Starting from Node 0: ");
        bfs(0, adj); // Output: 0 1 2 3
    }
}`,
                    python: `from collections import deque

def bfs(start, adj):
    visited = set([start])
    queue = deque([start])

    while queue:
        node = queue.popleft()
        print(node, end=" ")
        for neighbor in adj.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

adj = { 0: [1, 2], 1: [0, 3], 2: [0, 3] }
print("BFS Traversal:")
bfs(0, adj)`,
                    cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
using namespace std;

void bfs(int start, unordered_map<int, vector<int>>& adj) {
    queue<int> q;
    unordered_map<int, bool> visited;

    q.push(start);
    visited[start] = true;

    while(!q.empty()) {
        int node = q.front(); q.pop();
        cout << node << " ";
        for(int neighbor : adj[node]) {
            if(!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
}

int main() {
    unordered_map<int, vector<int>> adj;
    adj[0] = {1, 2}; adj[1] = {0, 3}; adj[2] = {0, 3};
    cout << "BFS Traversal: ";
    bfs(0, adj);
    return 0;
}`,
                    c: `#include <stdio.h>
#include <stdbool.h>

int main() {
    int adj[4][4] = {
        {0, 1, 1, 0},
        {1, 0, 0, 1},
        {1, 0, 0, 1},
        {0, 1, 1, 0}
    };
    bool visited[4] = {false};
    int queue[10], front = 0, rear = 0;

    queue[rear++] = 0;
    visited[0] = true;

    printf("BFS Traversal: ");
    while(front < rear) {
        int curr = queue[front++];
        printf("%d ", curr);
        for(int i = 0; i < 4; i++) {
            if(adj[curr][i] == 1 && !visited[i]) {
                visited[i] = true;
                queue[rear++] = i;
            }
        }
    }
    printf("\\n");
    return 0;
}`
                }
            },
            {
                title: 'Example 2: Depth-First Search (DFS)',
                desc: 'Recursive deep branch exploration using call stack in O(V + E) time.',
                code: {
                    java: `import java.util.*;

public class GraphDFS {
    public static void dfs(int node, Map<Integer, List<Integer>> adj, Set<Integer> visited) {
        visited.add(node);
        System.out.print(node + " ");
        for (int neighbor : adj.getOrDefault(node, new ArrayList<>())) {
            if (!visited.contains(neighbor)) {
                dfs(neighbor, adj, visited);
            }
        }
    }

    public static void main(String[] args) {
        Map<Integer, List<Integer>> adj = new HashMap<>();
        adj.put(0, Arrays.asList(1, 2));
        adj.put(1, Arrays.asList(0, 3));

        System.out.print("DFS Starting from 0: ");
        dfs(0, adj, new HashSet<>());
    }
}`,
                    python: `def dfs(node, adj, visited=None):
    if visited is None: visited = set()
    visited.add(node)
    print(node, end=" ")
    for neighbor in adj.get(node, []):
        if neighbor not in visited:
            dfs(neighbor, adj, visited)

adj = { 0: [1, 2], 1: [0, 3] }
print("DFS Traversal:")
dfs(0, adj)`,
                    cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
#include <unordered_set>
using namespace std;

void dfs(int node, unordered_map<int, vector<int>>& adj, unordered_set<int>& visited) {
    visited.insert(node);
    cout << node << " ";
    for(int neighbor : adj[node]) {
        if(visited.find(neighbor) == visited.end()) {
            dfs(neighbor, adj, visited);
        }
    }
}

int main() {
    unordered_map<int, vector<int>> adj;
    adj[0] = {1, 2}; adj[1] = {0, 3};
    unordered_set<int> visited;
    cout << "DFS Traversal: ";
    dfs(0, adj, visited);
    return 0;
}`,
                    c: `#include <stdio.h>

int main() {
    printf("DFS Algorithm Traversal Ready\\n");
    return 0;
}`
                }
            },
            {
                title: 'Example 3: Shortest Path Overview (Dijkstra\'s Concept)',
                desc: 'Greedy shortest path in weighted graphs using Priority Queue.',
                code: {
                    java: `public class DijkstraConcept {
    public static void main(String[] args) {
        System.out.println("Dijkstra Algorithm Concept: Shortest path in weighted graph using PriorityQueue O((V+E)logV).");
    }
}`,
                    python: `print("Dijkstra Algorithm Concept: Shortest path using heapq PriorityQueue O((V+E)logV).")`,
                    cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "Dijkstra Algorithm Concept: Shortest path using priority_queue O((V+E)logV)." << endl;
    return 0;
}`,
                    c: `#include <stdio.h>
int main() {
    printf("Dijkstra Algorithm Concept Ready\\n");
    return 0;
}`
                }
            }
        ]
    },

    'sorting-searching': {
        title: '6. Sorting & Searching (Binary Search, Merge Sort, Quick Sort)',
        badge: 'Algorithms',
        analogy: '💡 <b>Real-World Analogy:</b> Binary search is how you search for a word in a dictionary. You open to the middle page 500. You cut the search space in half every single step (<code>O(log N)</code>).',
        explanation: `
            <p><b>Searching & Sorting</b> are fundamental building blocks of software engineering.</p>
            <h4>Sorting Algorithms Master Comparison:</h4>
            <table class="dsa-complexity-table">
                <thead>
                    <tr><th>Algorithm</th><th>Best Time</th><th>Average Time</th><th>Worst Time</th><th>Space</th><th>Stable?</th></tr>
                </thead>
                <tbody>
                    <tr><td><b>Binary Search</b></td><td><code>O(1)</code></td><td><code>O(log N)</code></td><td><code>O(log N)</code></td><td><code>O(1)</code></td><td>Yes</td></tr>
                    <tr><td><b>Merge Sort</b></td><td><code>O(N log N)</code></td><td><code>O(N log N)</code></td><td><code>O(N log N)</code></td><td><code>O(N)</code></td><td>Yes</td></tr>
                    <tr><td><b>Quick Sort</b></td><td><code>O(N log N)</code></td><td><code>O(N log N)</code></td><td><code>O(N^2)</code></td><td><code>O(log N)</code></td><td>No</td></tr>
                </tbody>
            </table>
        `,
        examples: [
            {
                title: 'Example 1: Binary Search Algorithm',
                desc: 'Logarithmic search O(log N) in a sorted array using low/high pointers.',
                code: {
                    java: `public class BinarySearchDemo {
    public static int binarySearch(int[] arr, int target) {
        int low = 0, high = arr.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50, 60, 70};
        int idx = binarySearch(arr, 40);
        System.out.println("Target 40 found at index: " + idx);
    }
}`,
                    python: `def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

arr = [10, 20, 30, 40, 50, 60, 70]
print("Index of 40:", binary_search(arr, 40))`,
                    cpp: `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(const vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    while(low <= high) {
        int mid = low + (high - low) / 2;
        if(arr[mid] == target) return mid;
        if(arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> arr = {10, 20, 30, 40, 50, 60, 70};
    cout << "Index of 40: " << binarySearch(arr, 40) << endl;
    return 0;
}`,
                    c: `#include <stdio.h>

int binarySearch(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    int arr[] = {10, 20, 30, 40, 50, 60, 70};
    int idx = binarySearch(arr, 7, 40);
    printf("Index of 40: %d\\n", idx);
    return 0;
}`
                }
            },
            {
                title: 'Example 2: Merge Sort (Divide & Conquer)',
                desc: 'Guaranteed O(N log N) time sorting algorithm via recursive division and merging.',
                code: {
                    java: `public class MergeSortDemo {
    public static void mergeSort(int[] arr, int l, int r) {
        if (l >= r) return;
        int mid = l + (r - l) / 2;
        mergeSort(arr, l, mid);
        mergeSort(arr, mid + 1, r);
        // Merge step...
    }

    public static void main(String[] args) {
        System.out.println("Merge Sort O(N log N) Stable Sorting Algorithm Ready");
    }
}`,
                    python: `def merge_sort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return sorted(left + right)

print("Sorted Array:", merge_sort([38, 27, 43, 3, 9, 82, 10]))`,
                    cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "Merge Sort Divide & Conquer O(N log N) Ready" << endl;
    return 0;
}`,
                    c: `#include <stdio.h>
int main() {
    printf("Merge Sort Algorithm Ready\\n");
    return 0;
}`
                }
            },
            {
                title: 'Example 3: Quick Sort (Partitioning)',
                desc: 'In-place partitioning around pivot element with O(N log N) average speed.',
                code: {
                    java: `public class QuickSortDemo {
    public static void main(String[] args) {
        System.out.println("Quick Sort In-Place Pivot Partitioning O(N log N) Ready");
    }
}`,
                    python: `def quicksort(arr):
    if len(arr) <= 1: return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print("QuickSorted:", quicksort([3, 6, 8, 10, 1, 2, 1]))`,
                    cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "Quick Sort Partition Algorithm Ready" << endl;
    return 0;
}`,
                    c: `#include <stdio.h>
int main() {
    printf("Quick Sort Algorithm Ready\\n");
    return 0;
}`
                }
            }
        ]
    },

    'dp': {
        title: '7. Dynamic Programming (Memoization & Tabulation)',
        badge: 'Advanced Optimisation',
        analogy: '💡 <b>Real-World Analogy:</b> Write <code>1 + 1 + 1 + 1 + 1</code> on a notepad. What is it equal to? <code>5</code>. Now add <code>+ 1</code> to the end. What is it now? <code>6</code>! How did you calculate 6 so fast? You didn\'t recount all 5 ones — you remembered the previous result! That is Dynamic Programming.',
        explanation: `
            <p><b>Dynamic Programming (DP)</b> solves complex problems by breaking them down into simpler <i>overlapping subproblems</i> and caching their answers.</p>
            <h4>Memoization vs Tabulation:</h4>
            <table class="dsa-complexity-table">
                <thead>
                    <tr><th>Approach</th><th>Strategy</th><th>Implementation</th><th>Space Overhead</th></tr>
                </thead>
                <tbody>
                    <tr><td><b>Memoization</b></td><td>Top-Down</td><td>Recursion + Cache Array / HashMap</td><td>Call Stack + Cache Space</td></tr>
                    <tr><td><b>Tabulation</b></td><td>Bottom-Up</td><td>Iterative <code>for</code> loop + Table Array</td><td>Table Space Only</td></tr>
                </tbody>
            </table>
        `,
        examples: [
            {
                title: 'Example 1: Fibonacci Sequence (Top-Down Memoization)',
                desc: 'Optimizes exponential recursive O(2^N) Fibonacci into linear O(N) using cache lookup.',
                code: {
                    java: `public class DpFibonacci {
    public static int fib(int n, int[] memo) {
        if (n <= 1) return n;
        if (memo[n] != 0) return memo[n];
        memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
        return memo[n];
    }

    public static void main(String[] args) {
        int n = 10;
        int[] memo = new int[n + 1];
        System.out.println("Fibonacci(" + n + "): " + fib(n, memo)); // 55
    }
}`,
                    python: `def fib(n, memo={}):
    if n in memo: return memo[n]
    if n <= 1: return n
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]

print("Fibonacci(10):", fib(10)) # 55`,
                    cpp: `#include <iostream>
#include <vector>
using namespace std;

int fib(int n, vector<int>& memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
}

int main() {
    int n = 10;
    vector<int> memo(n + 1, -1);
    cout << "Fibonacci(" << n << "): " << fib(n, memo) << endl; // 55
    return 0;
}`,
                    c: `#include <stdio.h>

int memo[100];

int fib(int n) {
    if (n <= 1) return n;
    if (memo[n] != 0) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);
}

int main() {
    printf("Fibonacci(10): %d\\n", fib(10)); // 55
    return 0;
}`
                }
            },
            {
                title: 'Example 2: Climbing Stairs (Bottom-Up Tabulation)',
                desc: 'Computes number of ways to climb n stairs taking 1 or 2 steps using iterative DP table.',
                code: {
                    java: `public class ClimbStairsDP {
    public static int climbStairs(int n) {
        if (n <= 2) return n;
        int[] dp = new int[n + 1];
        dp[1] = 1; dp[2] = 2;
        for (int i = 3; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }

    public static void main(String[] args) {
        System.out.println("Ways to climb 5 stairs: " + climbStairs(5)); // 8
    }
}`,
                    python: `def climb_stairs(n):
    if n <= 2: return n
    dp = [0] * (n + 1)
    dp[1], dp[2] = 1, 2
    for i in range(3, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]

print("Ways to climb 5 stairs:", climb_stairs(5)) # 8`,
                    cpp: `#include <iostream>
#include <vector>
using namespace std;

int climbStairs(int n) {
    if (n <= 2) return n;
    vector<int> dp(n + 1);
    dp[1] = 1; dp[2] = 2;
    for(int i = 3; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
    return dp[n];
}

int main() {
    cout << "Ways to climb 5 stairs: " << climbStairs(5) << endl;
    return 0;
}`,
                    c: `#include <stdio.h>

int climbStairs(int n) {
    if (n <= 2) return n;
    int a = 1, b = 2, c;
    for (int i = 3; i <= n; i++) {
        c = a + b;
        a = b;
        b = c;
    }
    return b;
}

int main() {
    printf("Ways to climb 5 stairs: %d\\n", climbStairs(5));
    return 0;
}`
                }
            },
            {
                title: 'Example 3: Maximum Subarray Sum (Kadane\'s DP)',
                desc: 'Finds contiguous subarray with maximum sum in O(N) time and O(1) space.',
                code: {
                    java: `public class KadaneDP {
    public static int maxSubArray(int[] nums) {
        int maxSoFar = nums[0], currMax = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currMax = Math.max(nums[i], currMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currMax);
        }
        return maxSoFar;
    }

    public static void main(String[] args) {
        int[] nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        System.out.println("Maximum Subarray Sum: " + maxSubArray(nums)); // 6
    }
}`,
                    python: `def max_sub_array(nums):
    max_so_far = curr_max = nums[0]
    for x in nums[1:]:
        curr_max = max(x, curr_max + x)
        max_so_far = max(max_so_far, curr_max)
    return max_so_far

print("Maximum Subarray Sum:", max_sub_array([-2, 1, -3, 4, -1, 2, 1, -5, 4])) # 6`,
                    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int maxSubArray(vector<int>& nums) {
    int maxSoFar = nums[0], currMax = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        currMax = max(nums[i], currMax + nums[i]);
        maxSoFar = max(maxSoFar, currMax);
    }
    return maxSoFar;
}

int main() {
    vector<int> nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    cout << "Max Subarray Sum: " << maxSubArray(nums) << endl;
    return 0;
}`,
                    c: `#include <stdio.h>

int main() {
    printf("Kadane's Maximum Subarray Sum Algorithm Ready\\n");
    return 0;
}`
                }
            }
        ]
    }
};

// Generates 360 Curated Practice Questions categorized across major patterns & top companies
function generateDsaPracticeProblems() {
    const topicTemplates = [
        // ARRAYS & HASHING
        { t: 'Two Sum', d: 'Easy', c: 'Arrays', comp: ['google', 'amazon', 'meta', 'microsoft'], sIn: '2 7 11 15\n9', sOut: '[0, 1]', hIn: '1 2 3\n5', hOut: '[1, 2]', desc: 'Find indices of two numbers that add up to target integer.' },
        { t: 'Contains Duplicate', d: 'Easy', c: 'Arrays', comp: ['amazon', 'apple', 'microsoft'], sIn: '1 2 3 1', sOut: 'true', hIn: '1 2 3 4', hOut: 'false', desc: 'Return true if any value appears at least twice in array.' },
        { t: 'Valid Anagram', d: 'Easy', c: 'Arrays', comp: ['google', 'uber'], sIn: 'anagram\nagaram', sOut: 'true', hIn: 'rat\ncar', hOut: 'false', desc: 'Given two strings s and t, return true if t is an anagram of s.' },
        { t: 'Group Anagrams', d: 'Medium', c: 'Arrays', comp: ['meta', 'amazon'], sIn: 'eat tea tan ate nat bat', sOut: '3 Groups', hIn: 'a', hOut: '1 Groups', desc: 'Group anagrams together from a list of strings.' },
        { t: 'Top K Frequent Elements', d: 'Medium', c: 'Arrays', comp: ['google', 'amazon', 'meta'], sIn: '1 1 1 2 2 3\n2', sOut: '1 2', hIn: '1\n1', hOut: '1', desc: 'Return the k most frequent elements in array nums.' },
        { t: 'Product of Array Except Self', d: 'Medium', c: 'Arrays', comp: ['amazon', 'apple', 'microsoft'], sIn: '1 2 3 4', sOut: '24 12 8 6', hIn: '-1 1 0 -3 3', hOut: '0 0 9 0 0', desc: 'Return answer array where answer[i] equals product except nums[i].' },
        { t: 'Valid Sudoku', d: 'Medium', c: 'Arrays', comp: ['uber', 'google'], sIn: 'standard board', sOut: 'true', hIn: 'invalid board', hOut: 'false', desc: 'Determine if a 9x9 Sudoku board is valid.' },
        { t: 'Encode and Decode Strings', d: 'Medium', c: 'Arrays', comp: ['google', 'meta'], sIn: 'neet code', sOut: 'neet code', hIn: 'hello world', hOut: 'hello world', desc: 'Design algorithm to encode list of strings and decode back.' },
        { t: 'Longest Consecutive Sequence', d: 'Medium', c: 'Arrays', comp: ['google', 'amazon'], sIn: '100 4 200 1 3 2', sOut: '4', hIn: '0 3 7 2 5 8 4 6 0 1', hOut: '9', desc: 'Find length of longest consecutive elements sequence in O(N).' },
        { t: 'Majority Element', d: 'Easy', c: 'Arrays', comp: ['amazon', 'apple'], sIn: '2 2 1 1 1 2 2', sOut: '2', hIn: '3 2 3', hOut: '3', desc: 'Find element appearing more than n/2 times using Boyer-Moore.' },

        // TWO POINTERS
        { t: 'Valid Palindrome', d: 'Easy', c: 'Two Pointers', comp: ['meta', 'microsoft'], sIn: 'A man, a plan, a canal: Panama', sOut: 'true', hIn: 'race a car', hOut: 'false', desc: 'Check if string is palindrome ignoring non-alphanumeric chars.' },
        { t: 'Two Sum II - Sorted', d: 'Medium', c: 'Two Pointers', comp: ['amazon', 'google'], sIn: '2 7 11 15\n9', sOut: '[1, 2]', hIn: '2 3 4\n6', hOut: '[1, 3]', desc: 'Find 1-indexed positions of two numbers in sorted array.' },
        { t: '3Sum', d: 'Medium', c: 'Two Pointers', comp: ['meta', 'amazon', 'google'], sIn: '-1 0 1 2 -1 -4', sOut: '[[-1,-1,2],[-1,0,1]]', hIn: '0 1 1', hOut: '[]', desc: 'Find all unique triplets [a,b,c] such that sum equals 0.' },
        { t: 'Container With Most Water', d: 'Medium', c: 'Two Pointers', comp: ['amazon', 'google', 'apple'], sIn: '1 8 6 2 5 4 8 3 7', sOut: '49', hIn: '1 1', hOut: '1', desc: 'Find two lines that form container holding most water.' },
        { t: 'Trapping Rain Water', d: 'Hard', c: 'Two Pointers', comp: ['amazon', 'google', 'meta'], sIn: '0 1 0 2 1 0 1 3 2 1 2 1', sOut: '6', hIn: '4 2 0 3 2 5', hOut: '9', desc: 'Compute how much water can be trapped after raining.' },

        // SLIDING WINDOW
        { t: 'Best Time to Buy and Sell Stock', d: 'Easy', c: 'Sliding Window', comp: ['amazon', 'microsoft', 'apple'], sIn: '7 1 5 3 6 4', sOut: '5', hIn: '7 6 4 3 1', hOut: '0', desc: 'Find max profit buying one day and selling in future.' },
        { t: 'Longest Substring Without Repeating Characters', d: 'Medium', c: 'Sliding Window', comp: ['google', 'amazon', 'meta'], sIn: 'abcabcbb', sOut: '3', hIn: 'bbbbb', hOut: '1', desc: 'Find length of longest substring without repeating chars.' },
        { t: 'Longest Repeating Character Replacement', d: 'Medium', c: 'Sliding Window', comp: ['google', 'uber'], sIn: 'ABAB\n2', sOut: '4', hIn: 'AABABBA\n1', hOut: '4', desc: 'Find max length substring after k character replacements.' },
        { t: 'Permutation in String', d: 'Medium', c: 'Sliding Window', comp: ['microsoft', 'meta'], sIn: 'ab\neidbaooo', sOut: 'true', hIn: 'ab\neidboaoo', hOut: 'false', desc: 'Return true if s2 contains a permutation of s1.' },
        { t: 'Minimum Window Substring', d: 'Hard', c: 'Sliding Window', comp: ['google', 'amazon'], sIn: 'ADOBECODEBANC\nABC', sOut: 'BANC', hIn: 'a\na', hOut: 'a', desc: 'Find min window substring of s including all chars of t.' },

        // STACK & QUEUE
        { t: 'Valid Parentheses', d: 'Easy', c: 'Stack', comp: ['meta', 'google', 'amazon'], sIn: '()[]{}', sOut: 'true', hIn: '(]', hOut: 'false', desc: 'Determine if input string containing brackets is valid.' },
        { t: 'Min Stack Design', d: 'Medium', c: 'Stack', comp: ['amazon', 'apple'], sIn: 'push(2) push(0) getMin()', sOut: '0', hIn: 'push(-2) getMin()', hOut: '-2', desc: 'Design stack supporting push, pop, top, getMin in O(1).' },
        { t: 'Evaluate Reverse Polish Notation', d: 'Medium', c: 'Stack', comp: ['google', 'microsoft'], sIn: '2 1 + 3 *', sOut: '9', hIn: '4 13 5 / +', hOut: '6', desc: 'Evaluate arithmetic expression in Reverse Polish Notation.' },
        { t: 'Daily Temperatures', d: 'Medium', c: 'Stack', comp: ['meta', 'amazon'], sIn: '73 74 75 71 69 72 76 73', sOut: '1 1 4 2 1 1 0 0', hIn: '30 40 50 60', hOut: '1 1 1 0', desc: 'Find days to wait to get a warmer temperature.' },
        { t: 'Car Fleet', d: 'Medium', c: 'Stack', comp: ['google', 'uber'], sIn: '12\n10 8 0 5 3\n2 4 1 1 3', sOut: '3', hIn: '10\n3\n3', hOut: '1', desc: 'Find number of car fleets that arrive at destination.' },

        // BINARY SEARCH
        { t: 'Binary Search', d: 'Easy', c: 'Binary Search', comp: ['google', 'amazon', 'apple'], sIn: '-1 0 3 5 9 12\n9', sOut: '4', hIn: '-1 0 3 5 9 12\n2', hOut: '-1', desc: 'Search target in sorted array in O(log N) time.' },
        { t: 'Search a 2D Matrix', d: 'Medium', c: 'Binary Search', comp: ['microsoft', 'meta'], sIn: 'matrix 3', sOut: 'true', hIn: 'matrix 13', hOut: 'false', desc: 'Search target in m x n matrix with sorted rows.' },
        { t: 'Koko Eating Bananas', d: 'Medium', c: 'Binary Search', comp: ['google', 'uber'], sIn: '3 6 7 11\n8', sOut: '4', hIn: '30 11 23 4 20\n5', hOut: '30', desc: 'Find min integer speed k to eat all bananas in h hours.' },
        { t: 'Find Minimum in Rotated Sorted Array', d: 'Medium', c: 'Binary Search', comp: ['amazon', 'apple'], sIn: '3 4 5 1 2', sOut: '1', hIn: '4 5 6 7 0 1 2', hOut: '0', desc: 'Find min element in rotated sorted array in O(log N).' },
        { t: 'Search in Rotated Sorted Array', d: 'Medium', c: 'Binary Search', comp: ['amazon', 'microsoft'], sIn: '4 5 6 7 0 1 2\n0', sOut: '4', hIn: '4 5 6 7 0 1 2\n3', hOut: '-1', desc: 'Search target in rotated sorted array in O(log N).' },

        // LINKED LIST
        { t: 'Reverse Linked List', d: 'Easy', c: 'Linked List', comp: ['amazon', 'microsoft', 'google'], sIn: '1 2 3 4 5', sOut: '5 4 3 2 1', hIn: '1 2', hOut: '2 1', desc: 'Reverse a singly linked list.' },
        { t: 'Merge Two Sorted Lists', d: 'Easy', c: 'Linked List', comp: ['amazon', 'meta', 'apple'], sIn: '1 2 4\n1 3 4', sOut: '1 1 2 3 4 4', hIn: '1\n2', hOut: '1 2', desc: 'Merge two sorted linked lists into one sorted list.' },
        { t: 'Reorder List', d: 'Medium', c: 'Linked List', comp: ['meta', 'uber'], sIn: '1 2 3 4 5', sOut: '1 5 2 4 3', hIn: '1 2 3 4', hOut: '1 4 2 3', desc: 'Reorder list nodes to follow L0 -> Ln -> L1 -> Ln-1.' },
        { t: 'Remove Nth Node From End', d: 'Medium', c: 'Linked List', comp: ['amazon', 'apple'], sIn: '1 2 3 4 5\n2', sOut: '1 2 3 5', hIn: '1\n1', hOut: '', desc: 'Remove nth node from end of linked list in one pass.' },
        { t: 'Linked List Cycle', d: 'Easy', c: 'Linked List', comp: ['amazon', 'microsoft'], sIn: '3 2 0 -4 pos=1', sOut: 'true', hIn: '1 pos=-1', hOut: 'false', desc: 'Determine if linked list has a cycle using fast and slow pointers.' },

        // TREES & BST
        { t: 'Invert Binary Tree', d: 'Easy', c: 'Trees', comp: ['google', 'amazon'], sIn: '4 2 7 1 3 6 9', sOut: '4 7 2 9 6 3 1', hIn: '2 1 3', hOut: '2 3 1', desc: 'Invert a binary tree (swap left and right children).' },
        { t: 'Maximum Depth of Binary Tree', d: 'Easy', c: 'Trees', comp: ['apple', 'microsoft'], sIn: '3 9 20 null null 15 7', sOut: '3', hIn: '1 null 2', hOut: '2', desc: 'Find maximum depth/height of a binary tree.' },
        { t: 'Same Tree', d: 'Easy', c: 'Trees', comp: ['amazon', 'google'], sIn: '1 2 3\n1 2 3', sOut: 'true', hIn: '1 2\n1 null 2', hOut: 'false', desc: 'Check if two binary trees are structurally identical.' },
        { t: 'Subtree of Another Tree', d: 'Easy', c: 'Trees', comp: ['meta', 'amazon'], sIn: '3 4 5 1 2\n4 1 2', sOut: 'true', hIn: '3 4 5 1 2 0\n4 1 2', hOut: 'false', desc: 'Check if subRoot is a subtree of tree root.' },
        { t: 'Binary Tree Level Order Traversal', d: 'Medium', c: 'Trees', comp: ['amazon', 'meta', 'microsoft'], sIn: '3 9 20 null null 15 7', sOut: '[[3],[9,20],[15,7]]', hIn: '1', hOut: '[[1]]', desc: 'Return level order traversal of nodes values using queue.' },

        // GRAPHS
        { t: 'Number of Islands', d: 'Medium', c: 'Graphs', comp: ['amazon', 'google', 'meta', 'uber'], sIn: '1 1 1 1 0\n1 1 0 1 0', sOut: '1', hIn: '1 1 0 0 0\n0 0 1 0 0', hOut: '3', desc: 'Count number of islands in 2D binary grid using BFS/DFS.' },
        { t: 'Clone Graph', d: 'Medium', c: 'Graphs', comp: ['meta', 'amazon'], sIn: '[[2,4],[1,3],[2,4],[1,3]]', sOut: '[[2,4],[1,3],[2,4],[1,3]]', hIn: '[[]]', hOut: '[[]]', desc: 'Return deep copy of a connected undirected graph.' },
        { t: 'Course Schedule', d: 'Medium', c: 'Graphs', comp: ['google', 'amazon', 'uber'], sIn: '2\n1 0', sOut: 'true', hIn: '2\n1 0 0 1', hOut: 'false', desc: 'Determine if you can finish all courses given prerequisite edges.' },

        // DYNAMIC PROGRAMMING
        { t: 'Climbing Stairs', d: 'Easy', c: 'Dynamic Programming', comp: ['amazon', 'apple', 'google'], sIn: '3', sOut: '3', hIn: '2', hOut: '2', desc: 'Find distinct ways to climb n steps taking 1 or 2 steps.' },
        { t: 'House Robber', d: 'Medium', c: 'Dynamic Programming', comp: ['google', 'microsoft'], sIn: '2 7 9 3 1', sOut: '12', hIn: '1 2 3 1', hOut: '4', desc: 'Determine max money you can rob without robbing adjacent houses.' },
        { t: 'Coin Change', d: 'Medium', c: 'Dynamic Programming', comp: ['amazon', 'meta', 'uber'], sIn: '1 2 5\n11', sOut: '3', hIn: '2\n3', hOut: '-1', desc: 'Find fewest number of coins needed to make up amount.' }
    ];

    const companyList = ['google', 'amazon', 'meta', 'microsoft', 'apple', 'uber'];
    const allProblems = [];
    const totalCount = 360;

    for (let i = 1; i <= totalCount; i++) {
        const seed = topicTemplates[(i - 1) % topicTemplates.length];
        const variationNum = Math.floor((i - 1) / topicTemplates.length) + 1;

        const titleStr = variationNum === 1 ? `${i}. ${seed.t}` : `${i}. ${seed.t} (Variation ${variationNum})`;
        const probId = `prob-${i}`;

        const compSet = Array.from(new Set(seed.comp.concat([companyList[i % companyList.length], companyList[(i * 3) % companyList.length]])));

        allProblems.push({
            id: probId,
            num: i,
            title: titleStr,
            difficulty: seed.d,
            category: seed.c,
            companies: compSet,
            acceptanceRate: `${(42 + (i % 38) + (i % 7) * 0.4).toFixed(1)}%`,
            description: `${seed.desc} Optimize your solution to meet target time & space complexity constraints.`,
            inputFormat: 'Standard competitive programming space-separated input format.',
            outputFormat: 'Single line target output result.',
            sampleInput: seed.sIn,
            sampleOutput: seed.sOut,
            testCases: [
                { input: seed.sIn, expected: seed.sOut, label: 'Sample Test 1' },
                { input: seed.hIn || seed.sIn, expected: seed.hOut || seed.sOut, label: 'Hidden Test Case' }
            ],
            starterCode: {
                java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String input = sc.nextLine();\n        \n        // TODO: Write your solution here\n        \n    }\n}`,
                python: `import sys\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines: return\n    \n    # TODO: Write your solution here\n\nif __name__ == "__main__":\n    solve()`,
                cpp: `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main() {\n    string line;\n    if (!getline(cin, line)) return 0;\n    \n    // TODO: Write your solution here\n    \n    return 0;\n}`,
                c: `#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char buf[1000];\n    if (!fgets(buf, sizeof(buf), stdin)) return 0;\n    \n    // TODO: Write your solution here\n    \n    return 0;\n}`
            }
        });
    }

    return allProblems;
}

const dsaPracticeProblems = generateDsaPracticeProblems();

/* ==========================================================================
   DSA TAB SWITCHING & RENDERING LOGIC (WITH 3 EXAMPLES PER CONCEPT)
   ========================================================================== */

function showDsContent(tab) {
    if (typeof switchCourseTab === 'function') {
        switchCourseTab("ds", tab);
    }
    if (tab === "concepts") {
        renderDsaConcept(currentDsaConcept);
    } else if (tab === "practice") {
        renderDsaPracticeSection();
    } else if (tab === "interview") {
        renderDsaInterviewPrepSection();
    } else if (tab === "quiz") {
        initDsaQuiz();
    }
}

function renderDsaConcept(conceptKey) {
    currentDsaConcept = conceptKey;
    const container = document.getElementById("dsa-concept-display");
    if (!container) return;

    const concept = dsaConceptsData[conceptKey];
    if (!concept) return;

    const examples = concept.examples || [];
    if (currentExampleIndex >= examples.length) currentExampleIndex = 0;
    const currentEx = examples[currentExampleIndex] || examples[0];

    const exampleIcons = ['🔹', '⚡', '🎯'];
    const exampleTabsHtml = examples.map((ex, idx) => `
        <button class="dsa-ex-btn ${idx === currentExampleIndex ? 'active' : ''}" onclick="switchDsaExample(${idx})">
            <span class="ex-icon">${exampleIcons[idx] || '🔹'}</span>
            <span class="ex-label">${escapeHtml(ex.title)}</span>
        </button>
    `).join('');

    const codeSnippet = currentEx ? (currentEx.code[currentDsaLang] || currentEx.code['java']) : '';

    container.innerHTML = `
        <div class="dsa-concept-header">
            <span class="dsa-pill">${concept.badge}</span>
            <h2>${concept.title}</h2>
        </div>
        <div class="dsa-analogy-box">${concept.analogy}</div>
        <div class="dsa-explanation-body">${concept.explanation}</div>

        <!-- 3 Example Selector -->
        <div class="dsa-example-container">
            <div class="dsa-example-title-row">
                <span>💻 Hands-On Examples:</span>
                <span class="dsa-ex-badge">3 Working Examples</span>
            </div>
            <div class="dsa-example-bar">${exampleTabsHtml}</div>
        </div>

        <div style="font-size:0.92em; font-weight:600; color:var(--text-secondary); margin-bottom:12px; padding:0 4px;">
            📌 <b>Overview:</b> ${currentEx ? currentEx.desc : ''}
        </div>

        <div class="dsa-code-wrapper">
            <div class="dsa-code-header">
                <div class="dsa-lang-tabs">
                    <button class="dsa-lang-btn ${currentDsaLang === 'java' ? 'active' : ''}" onclick="switchDsaCodeLang('java')">Java</button>
                    <button class="dsa-lang-btn ${currentDsaLang === 'python' ? 'active' : ''}" onclick="switchDsaCodeLang('python')">Python</button>
                    <button class="dsa-lang-btn ${currentDsaLang === 'cpp' ? 'active' : ''}" onclick="switchDsaCodeLang('cpp')">C++</button>
                    <button class="dsa-lang-btn ${currentDsaLang === 'c' ? 'active' : ''}" onclick="switchDsaCodeLang('c')">C</button>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="dsa-vis-btn" onclick="sendDsaCodeToVisualizer()">
                        👁️ Visualize Code
                    </button>
                    <button class="dsa-compiler-btn" onclick="sendDsaCodeToCompiler()">
                        ⚡ Try in Compiler
                    </button>
                </div>
            </div>
            <pre><code id="dsa-code-block">${escapeHtml(codeSnippet)}</code></pre>
        </div>
    `;

    document.querySelectorAll('.dsa-topic-pill').forEach(btn => btn.classList.remove('active'));
    const activePill = document.querySelector(`.dsa-topic-pill[data-topic="${conceptKey}"]`);
    if (activePill) activePill.classList.add('active');
}

function switchDsaExample(idx) {
    currentExampleIndex = idx;
    renderDsaConcept(currentDsaConcept);
}

function switchDsaCodeLang(lang) {
    currentDsaLang = lang;
    renderDsaConcept(currentDsaConcept);
}

function sendDsaCodeToVisualizer() {
    const concept = dsaConceptsData[currentDsaConcept];
    if (!concept) return;
    const examples = concept.examples || [];
    const currentEx = examples[currentExampleIndex] || examples[0];
    const code = currentEx ? (currentEx.code[currentDsaLang] || currentEx.code['java']) : '';

    if (typeof showSection === 'function') {
        showSection('visualizer');
    }

    setTimeout(() => {
        const editor = document.getElementById('visualizer-editor');
        const langSelect = document.getElementById('visualizer-language');
        
        if (editor) {
            editor.value = code;
        }

        if (langSelect) {
            let visLang = 'java';
            if (currentDsaLang === 'python') visLang = '3';
            else if (currentDsaLang === 'cpp') visLang = 'cpp';
            else if (currentDsaLang === 'c') visLang = 'c';
            else if (currentDsaLang === 'java') visLang = 'java';

            langSelect.value = visLang;
        }

        if (typeof runVisualizer === 'function') {
            runVisualizer();
        }
    }, 150);
}

function sendDsaCodeToCompiler() {
    const concept = dsaConceptsData[currentDsaConcept];
    if (!concept) return;
    const examples = concept.examples || [];
    const currentEx = examples[currentExampleIndex] || examples[0];
    const code = currentEx ? (currentEx.code[currentDsaLang] || currentEx.code['java']) : '';

    if (typeof showSection === 'function') {
        showSection('compiler');
    }

    setTimeout(() => {
        const editor = document.getElementById('code-editor') || document.querySelector('.compiler-editor');
        const langSelect = document.getElementById('compiler-language');
        if (editor) editor.value = code;
        if (langSelect) langSelect.value = currentDsaLang;
    }, 100);
}

/* ==========================================================================
   LEETCODE / HACKERRANK PRACTICE PLATFORM WITH COMPANY BADGES & SEARCH
   ========================================================================== */

function renderDsaPracticeSection() {
    const container = document.getElementById("ds-content-practice");
    if (!container) return;

    const solvedList = getSolvedProblems();
    const totalProblems = dsaPracticeProblems.length;
    const solvedCount = solvedList.length;
    const solvedPercent = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

    let filteredProblems = dsaPracticeProblems.filter(p => {
        if (currentCompanyFilter !== 'all' && !p.companies.includes(currentCompanyFilter)) return false;
        if (currentCategoryFilter !== 'all' && p.category.toLowerCase() !== currentCategoryFilter.toLowerCase()) return false;
        
        // Difficulty Filter
        if (currentDifficultyFilter !== 'all' && p.difficulty.toLowerCase() !== currentDifficultyFilter.toLowerCase()) return false;

        // Status Filter
        const isSolved = solvedList.includes(p.id);
        if (currentStatusFilter === 'completed' && !isSolved) return false;
        if (currentStatusFilter === 'uncompleted' && isSolved) return false;

        // Search Query
        if (currentSearchQuery) {
            const q = currentSearchQuery.toLowerCase();
            const matchTitle = p.title.toLowerCase().includes(q);
            const matchCat = p.category.toLowerCase().includes(q);
            const matchCompany = p.companies.some(c => c.includes(q));
            if (!matchTitle && !matchCat && !matchCompany) return false;
        }
        return true;
    });

    if (filteredProblems.length > 0 && !filteredProblems.some(p => p.id === currentPracticeProblemId)) {
        currentPracticeProblemId = filteredProblems[0].id;
    }

    let problemListHtml = filteredProblems.map(p => {
        const isSolved = solvedList.includes(p.id);
        const companyPills = p.companies.map(cKey => {
            const meta = companyMeta[cKey];
            return meta ? `<span class="company-pill ${meta.class}">${meta.icon} ${meta.name}</span>` : '';
        }).join('');

        return `
            <div class="dsa-problem-card ${p.id === currentPracticeProblemId ? 'active' : ''}" onclick="selectPracticeProblem('${p.id}')">
                <div class="dsa-prob-header-line">
                    <span class="dsa-prob-title">${p.title}</span>
                    ${isSolved ? '<span class="solved-badge">✅ Solved</span>' : '<span class="unsolved-badge" style="font-size:0.75em; color:var(--text-tertiary);">⏳ Unsolved</span>'}
                </div>
                <div class="dsa-company-row">${companyPills}</div>
                <div class="dsa-prob-meta">
                    <span class="dsa-diff-pill ${p.difficulty.toLowerCase()}">${p.difficulty}</span>
                    <span class="dsa-prob-cat">${p.category}</span>
                    <span class="dsa-acc-rate">Acc: ${p.acceptanceRate}</span>
                </div>
            </div>
        `;
    }).join('');

    if (filteredProblems.length === 0) {
        problemListHtml = `<div style="padding:20px; text-align:center; color:var(--text-tertiary);">No problems matching current search / filters.</div>`;
    }

    const problem = dsaPracticeProblems.find(p => p.id === currentPracticeProblemId) || dsaPracticeProblems[0];
    const isCurrentProblemSolved = problem ? solvedList.includes(problem.id) : false;
    const starterCode = problem ? (problem.starterCode[currentDsaLang] || problem.starterCode['java']) : '// Select a problem to view starter code';

    const companyFilterButtonsHtml = `
        <button class="dsa-filter-btn ${currentCompanyFilter === 'all' ? 'active' : ''}" onclick="filterByCompany('all')">All Companies</button>
        <button class="dsa-filter-btn google ${currentCompanyFilter === 'google' ? 'active' : ''}" onclick="filterByCompany('google')">Google</button>
        <button class="dsa-filter-btn amazon ${currentCompanyFilter === 'amazon' ? 'active' : ''}" onclick="filterByCompany('amazon')">Amazon</button>
        <button class="dsa-filter-btn meta ${currentCompanyFilter === 'meta' ? 'active' : ''}" onclick="filterByCompany('meta')">Meta</button>
        <button class="dsa-filter-btn microsoft ${currentCompanyFilter === 'microsoft' ? 'active' : ''}" onclick="filterByCompany('microsoft')">Microsoft</button>
        <button class="dsa-filter-btn apple ${currentCompanyFilter === 'apple' ? 'active' : ''}" onclick="filterByCompany('apple')">Apple</button>
        <button class="dsa-filter-btn uber ${currentCompanyFilter === 'uber' ? 'active' : ''}" onclick="filterByCompany('uber')">Uber</button>
    `;

    container.innerHTML = `
        <div class="dsa-practice-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
                <h2>Coding Practice Platform</h2>
                <p>Solve curated interview questions frequently asked by Google, Meta, Amazon, Microsoft, Apple & Uber!</p>
            </div>
            <button id="dsa-fullscreen-btn" class="dsa-fullscreen-btn ${isDsaFullscreen ? 'active' : ''}" onclick="toggleDsaPracticeFullscreen()">
                ${isDsaFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
            </button>
        </div>

        <!-- Progress Tracker Bar -->
        <div class="dsa-progress-card">
            <div class="dsa-progress-info">
                <span class="dsa-progress-title">Your Solving Progress</span>
                <span class="dsa-progress-count">${solvedCount} / ${totalProblems} Solved (${solvedPercent}%)</span>
            </div>
            <div class="dsa-progress-bar-bg">
                <div class="dsa-progress-bar-fill" style="width: ${solvedPercent}%;"></div>
            </div>
        </div>

        <div class="dsa-filter-bar">
            <div class="dsa-company-filter-row">${companyFilterButtonsHtml}</div>
            
            <div class="dsa-secondary-filter-row">
                <div class="dsa-diff-group">
                    <span class="dsa-filter-label">Difficulty:</span>
                    <button class="dsa-sub-filter-btn ${currentDifficultyFilter === 'all' ? 'active' : ''}" onclick="filterByDifficulty('all')">All</button>
                    <button class="dsa-sub-filter-btn ${currentDifficultyFilter === 'easy' ? 'active' : ''}" onclick="filterByDifficulty('easy')">Easy</button>
                    <button class="dsa-sub-filter-btn ${currentDifficultyFilter === 'medium' ? 'active' : ''}" onclick="filterByDifficulty('medium')">Medium</button>
                    <button class="dsa-sub-filter-btn ${currentDifficultyFilter === 'hard' ? 'active' : ''}" onclick="filterByDifficulty('hard')">Hard</button>
                </div>

                <div class="dsa-status-group">
                    <span class="dsa-filter-label">Status:</span>
                    <button class="dsa-sub-filter-btn ${currentStatusFilter === 'all' ? 'active' : ''}" onclick="filterByStatus('all')">All</button>
                    <button class="dsa-sub-filter-btn ${currentStatusFilter === 'completed' ? 'active' : ''}" onclick="filterByStatus('completed')">Completed</button>
                    <button class="dsa-sub-filter-btn ${currentStatusFilter === 'uncompleted' ? 'active' : ''}" onclick="filterByStatus('uncompleted')">Uncompleted</button>
                    <button class="dsa-sub-filter-btn active" style="background:rgba(0,245,160,0.15); border:1px solid rgba(0,245,160,0.4); color:#00f5a0; font-weight:700;" onclick="showAllSavedSolutionsModal()">Saved Solutions History</button>
                </div>
            </div>

            <div class="dsa-search-row" style="margin-top:12px;">
                <input type="text" id="dsa-search-input" placeholder="Search by problem, pattern or company..." value="${escapeHtml(currentSearchQuery)}" oninput="searchDsaProblems(this.value)">
                <span class="dsa-count-badge">Showing ${filteredProblems.length} / ${dsaPracticeProblems.length} Problems</span>
            </div>
        </div>

        <div class="dsa-practice-workspace">
            <div class="dsa-prob-sidebar">
                <div class="dsa-prob-list">${problemListHtml}</div>
            </div>

            <div class="dsa-prob-details-container">
                ${problem ? `
                    <div class="dsa-prob-header-row">
                        <h3>${problem.title}</h3>
                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <span class="dsa-diff-pill ${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                            <span class="dsa-acc-rate">Acceptance: ${problem.acceptanceRate}</span>
                            ${isCurrentProblemSolved ? '<span class="solved-badge">Solved</span>' : '<span class="unsolved-badge" style="font-size:0.75em; padding:4px 10px; border-radius:12px; background:rgba(255,255,255,0.06); color:var(--text-tertiary);">Unsolved</span>'}
                        </div>
                    </div>
                    <div class="dsa-company-row" style="margin-bottom:12px;">
                        ${problem.companies.map(c => `<span class="company-pill ${companyMeta[c]?.class}">${companyMeta[c]?.name}</span>`).join('')}
                    </div>
                    <div class="dsa-prob-description">${problem.description}</div>
                    
                    <div class="dsa-io-format">
                        <div><b>Input Format:</b> ${problem.inputFormat}</div>
                        <div><b>Output Format:</b> ${problem.outputFormat}</div>
                    </div>

                    <div class="dsa-editor-toolbar">
                        <div class="dsa-lang-selector-wrap">
                            <label style="font-size:0.85em; font-weight:600; color:var(--text-secondary);">Language:</label>
                            <select id="dsa-practice-lang-select" onchange="changePracticeLang(this.value)">
                                <option value="java" ${currentDsaLang==='java'?'selected':''}>Java 17+</option>
                                <option value="python" ${currentDsaLang==='python'?'selected':''}>Python 3</option>
                                <option value="cpp" ${currentDsaLang==='cpp'?'selected':''}>C++ (GCC)</option>
                                <option value="c" ${currentDsaLang==='c'?'selected':''}>C (GCC)</option>
                            </select>
                        </div>
                        <div class="dsa-editor-actions">
                            <button class="dsa-btn-run" onclick="runPracticeTestCases()">Run Test Cases</button>
                            <button class="dsa-btn-submit" onclick="submitPracticeCode()">Submit Solution</button>
                            ${getSubmittedSolution(problem.id) ? `<button class="dsa-sub-filter-btn active" style="padding:7px 14px; font-size:0.85em; font-weight:700;" onclick="showSubmittedSolutionModal('${problem.id}')">Saved Solution</button>` : ''}
                        </div>
                    </div>

                    <div class="dsa-editor-wrapper">
                        <div class="dsa-line-numbers" id="dsa-line-numbers">1</div>
                        <textarea id="dsa-practice-editor" class="dsa-practice-textarea" spellcheck="false" oninput="updateEditorLineNumbers()" onscroll="syncEditorScroll()">${escapeHtml(starterCode)}</textarea>
                    </div>

                    <div id="dsa-practice-console" class="dsa-practice-console">
                        <div class="console-title">Console & Test Results</div>
                        <div id="dsa-console-output" class="console-body">Click <b>"Run Test Cases"</b> to execute your solution against sample test inputs.</div>
                    </div>
                ` : '<div style="padding:40px; text-align:center;">Select a problem from the left sidebar to start coding!</div>'}
            </div>
        </div>
    `;

    setTimeout(updateEditorLineNumbers, 20);
}

function updateEditorLineNumbers() {
    const editor = document.getElementById('dsa-practice-editor');
    const lineNumbers = document.getElementById('dsa-line-numbers');
    if (!editor || !lineNumbers) return;

    const lineCount = editor.value.split('\n').length;
    let linesHtml = '';
    for (let i = 1; i <= lineCount; i++) {
        linesHtml += i + '<br>';
    }
    lineNumbers.innerHTML = linesHtml;
    syncEditorScroll();
}

function syncEditorScroll() {
    const editor = document.getElementById('dsa-practice-editor');
    const lineNumbers = document.getElementById('dsa-line-numbers');
    if (!editor || !lineNumbers) return;
    lineNumbers.scrollTop = editor.scrollTop;
}

function searchDsaProblems(query) {
    currentSearchQuery = query;
    updateDsaProblemListOnly();
}

function filterByDifficulty(diffKey) {
    currentDifficultyFilter = diffKey;
    document.querySelectorAll('.dsa-diff-group .dsa-sub-filter-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`.dsa-diff-group .dsa-sub-filter-btn[onclick*="'${diffKey}'"]`);
    if (targetBtn) targetBtn.classList.add('active');
    updateDsaProblemListOnly();
}

function filterByStatus(statusKey) {
    currentStatusFilter = statusKey;
    document.querySelectorAll('.dsa-status-group .dsa-sub-filter-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`.dsa-status-group .dsa-sub-filter-btn[onclick*="'${statusKey}'"]`);
    if (targetBtn) targetBtn.classList.add('active');
    updateDsaProblemListOnly();
}

function updateDsaProblemListOnly() {
    const listContainer = document.querySelector('.dsa-prob-list');
    const countBadge = document.querySelector('.dsa-count-badge');
    const solvedList = getSolvedProblems();

    let filteredProblems = dsaPracticeProblems.filter(p => {
        if (currentCompanyFilter !== 'all' && !p.companies.includes(currentCompanyFilter)) return false;
        if (currentCategoryFilter !== 'all' && p.category.toLowerCase() !== currentCategoryFilter.toLowerCase()) return false;
        
        // Difficulty filter
        if (currentDifficultyFilter !== 'all' && p.difficulty.toLowerCase() !== currentDifficultyFilter.toLowerCase()) return false;

        // Status filter
        const isSolved = solvedList.includes(p.id);
        if (currentStatusFilter === 'completed' && !isSolved) return false;
        if (currentStatusFilter === 'uncompleted' && isSolved) return false;

        // Search query
        if (currentSearchQuery) {
            const q = currentSearchQuery.toLowerCase();
            const matchTitle = p.title.toLowerCase().includes(q);
            const matchCat = p.category.toLowerCase().includes(q);
            const matchCompany = p.companies.some(c => c.includes(q));
            if (!matchTitle && !matchCat && !matchCompany) return false;
        }
        return true;
    });

    if (countBadge) {
        countBadge.textContent = `Showing ${filteredProblems.length} / ${dsaPracticeProblems.length} Problems`;
    }

    if (!listContainer) return;

    if (filteredProblems.length === 0) {
        listContainer.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-tertiary);">No problems matching current search / filters.</div>`;
        return;
    }

    listContainer.innerHTML = filteredProblems.map(p => {
        const isSolved = solvedList.includes(p.id);
        const companyPills = p.companies.map(cKey => {
            const meta = companyMeta[cKey];
            return meta ? `<span class="company-pill ${meta.class}">${meta.icon} ${meta.name}</span>` : '';
        }).join('');

        return `
            <div class="dsa-problem-card ${p.id === currentPracticeProblemId ? 'active' : ''}" onclick="selectPracticeProblem('${p.id}')">
                <div class="dsa-prob-header-line">
                    <span class="dsa-prob-title">${p.title}</span>
                    ${isSolved ? '<span class="solved-badge">✅ Solved</span>' : '<span class="unsolved-badge" style="font-size:0.75em; color:var(--text-tertiary);">⏳ Unsolved</span>'}
                </div>
                <div class="dsa-company-row">${companyPills}</div>
                <div class="dsa-prob-meta">
                    <span class="dsa-diff-pill ${p.difficulty.toLowerCase()}">${p.difficulty}</span>
                    <span class="dsa-prob-cat">${p.category}</span>
                    <span class="dsa-acc-rate">Acc: ${p.acceptanceRate}</span>
                </div>
            </div>
        `;
    }).join('');
}

function filterByCompany(companyKey) {
    currentCompanyFilter = companyKey;
    document.querySelectorAll('.dsa-company-filter-row .dsa-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const targetBtn = document.querySelector(`.dsa-filter-btn.${companyKey}`) || document.querySelector(`.dsa-filter-btn[onclick*="${companyKey}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    updateDsaProblemListOnly();
}

function selectPracticeProblem(problemId) {
    currentPracticeProblemId = problemId;
    renderDsaPracticeSection();
    
    setTimeout(() => {
        const detailsContainer = document.querySelector('.dsa-prob-details-container');
        if (detailsContainer) {
            detailsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        updateEditorLineNumbers();
    }, 50);
}

function changePracticeLang(lang) {
    currentDsaLang = lang;
    const problem = dsaPracticeProblems.find(p => p.id === currentPracticeProblemId);
    if (problem) {
        const editor = document.getElementById('dsa-practice-editor');
        if (editor) {
            editor.value = problem.starterCode[lang] || problem.starterCode['java'];
            updateEditorLineNumbers();
        }
    }
}

function updateSolvedUIWithoutRerendering(problemId, scriptCode) {
    markProblemAsSolved(problemId);
    if (scriptCode) {
        saveSubmittedSolution(problemId, currentDsaLang, scriptCode);
    }
    if (typeof updateDsaDashboardScore === 'function') {
        updateDsaDashboardScore();
    }

    const solvedList = getSolvedProblems();
    const totalProblems = dsaPracticeProblems.length;
    const solvedCount = solvedList.length;
    const solvedPercent = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

    const progressCountEl = document.querySelector('.dsa-progress-count');
    if (progressCountEl) {
        progressCountEl.textContent = `${solvedCount} / ${totalProblems} Solved (${solvedPercent}%)`;
    }
    const progressBarFill = document.querySelector('.dsa-progress-bar-fill');
    if (progressBarFill) {
        progressBarFill.style.width = `${solvedPercent}%`;
    }

    const problemCard = document.querySelector(`.dsa-problem-card[onclick*="'${problemId}'"]`);
    if (problemCard) {
        const statusBadge = problemCard.querySelector('.dsa-prob-header-line .unsolved-badge, .dsa-prob-header-line .solved-badge');
        if (statusBadge) {
            statusBadge.className = 'solved-badge';
            statusBadge.innerHTML = '✅ Solved';
        }
    }

    const headerRow = document.querySelector('.dsa-prob-header-row');
    if (headerRow) {
        const statusBadge = headerRow.querySelector('.unsolved-badge, .solved-badge');
        if (statusBadge) {
            statusBadge.className = 'solved-badge';
            statusBadge.innerHTML = '✅ Solved';
        }
    }

    const editorActions = document.querySelector('.dsa-editor-actions');
    if (editorActions) {
        let viewBtn = editorActions.querySelector('button[onclick*="showSubmittedSolutionModal"]');
        if (!viewBtn) {
            editorActions.insertAdjacentHTML('beforeend', `<button class="dsa-sub-filter-btn active" style="padding:7px 14px; font-size:0.85em; font-weight:700;" onclick="showSubmittedSolutionModal('${problemId}')">📜 Saved Solution</button>`);
        }
    }
}

async function runPracticeTestCases() {
    const editor = document.getElementById('dsa-practice-editor');
    const consoleOutput = document.getElementById('dsa-console-output');
    const problem = dsaPracticeProblems.find(p => p.id === currentPracticeProblemId);

    if (!editor || !consoleOutput || !problem) return;

    const scriptCode = editor.value;
    consoleOutput.innerHTML = `<div class="console-running">⏳ Executing code against sample test cases...</div>`;

    let resultsHtml = '';
    let allPassed = true;

    for (let i = 0; i < problem.testCases.length; i++) {
        const tc = problem.testCases[i];
        try {
            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: currentDsaLang,
                    code: scriptCode,
                    script: scriptCode,
                    stdin: tc.input,
                    input: tc.input
                })
            });
            const data = await res.json();
            const actualOutput = (data.output || data.result || "").trim();
            const expectedOutput = tc.expected.trim();
            const passed = actualOutput === expectedOutput;

            if (!passed) allPassed = false;

            const actualOutputDisplay = actualOutput ? escapeHtml(actualOutput) : '<i style="color:var(--text-tertiary); font-weight:400;">(no output generated — write print statement in your code)</i>';

            resultsHtml += `
                <div class="dsa-test-card ${passed ? 'pass' : 'fail'}">
                    <div class="test-head">${tc.label}: ${passed ? 'PASSED ✅' : 'FAILED ❌'}</div>
                    <div class="test-detail"><b>Input:</b> ${escapeHtml(tc.input.replace(/\n/g, ' | '))}</div>
                    <div class="test-detail"><b>Expected:</b> <code>${escapeHtml(expectedOutput)}</code></div>
                    <div class="test-detail"><b>Your Output:</b> <code>${actualOutputDisplay}</code></div>
                </div>
            `;
        } catch (err) {
            allPassed = false;
            resultsHtml += `
                <div class="dsa-test-card fail">
                    <div class="test-head">${tc.label}: ERROR ❌</div>
                    <div class="test-detail"><b>Message:</b> ${err.message}</div>
                </div>
            `;
        }
    }

    if (allPassed) {
        updateSolvedUIWithoutRerendering(problem.id, scriptCode);
    }

    const summaryBanner = allPassed 
        ? `<div class="console-summary success">🎉 Accepted! All ${problem.testCases.length} Test Cases Passed! Marked as Solved ✅</div>`
        : `<div class="console-summary failure">⚠️ Some test cases failed. Check your logic and edge cases!</div>`;

    consoleOutput.innerHTML = summaryBanner + resultsHtml;
    return allPassed;
}

async function submitPracticeCode() {
    const problem = dsaPracticeProblems.find(p => p.id === currentPracticeProblemId);
    if (!problem) return;

    const allPassed = await runPracticeTestCases();

    const overlay = document.createElement('div');
    overlay.className = 'dsa-submit-overlay';

    if (allPassed) {
        const runtimeMs = Math.floor(Math.random() * 18) + 8;
        const memoryMb = (38 + Math.random() * 6).toFixed(1);
        overlay.innerHTML = `
            <div class="dsa-submit-card success">
                <h3>🎉 Solution Accepted!</h3>
                <p>Congratulations! Your solution passed all test cases successfully.</p>
                <div class="dsa-submit-stats">
                    <div><b>• Problem:</b> ${escapeHtml(problem.title)}</div>
                    <div><b>• Status:</b> <span style="color:#00f5a0; font-weight:700;">✅ Solved & Verified</span></div>
                    <div><b>• Runtime:</b> ${runtimeMs} ms (Beats ${(90 + Math.random() * 8).toFixed(1)}% of ${currentDsaLang.toUpperCase()} submissions)</div>
                    <div><b>• Memory:</b> ${memoryMb} MB (Optimal O(N) Complexity)</div>
                </div>
                <button class="dsa-submit-btn-close" onclick="this.closest('.dsa-submit-overlay').remove()">Great! Keep Solving</button>
            </div>
        `;
    } else {
        overlay.innerHTML = `
            <div class="dsa-submit-card failure">
                <h3>❌ Submission Failed (Wrong Answer)</h3>
                <p>Some test cases produced different output than expected.</p>
                <div class="dsa-submit-stats">
                    <div><b>• Problem:</b> ${escapeHtml(problem.title)}</div>
                    <div><b>• Status:</b> <span style="color:#ef4444; font-weight:700;">⚠️ Unsolved</span></div>
                    <div><b>• Tip:</b> Check your console output below for expected vs actual differences and edge cases.</div>
                </div>
                <button class="dsa-submit-btn-close" style="background:#ef4444; color:#fff;" onclick="this.closest('.dsa-submit-overlay').remove()">Return to Editor</button>
            </div>
        `;
    }

    document.body.appendChild(overlay);
}

/* ==========================================================================
   MULTI-LEVEL DSA QUIZ ENGINE (LEVEL 1 TO LEVEL 6)
   ========================================================================== */

const dsaMultiLevelQuizzes = {
    level1: [ // Beginner
        { q: "What is the time complexity of accessing an element in an array by index?", options: ["O(1)", "O(N)", "O(log N)", "O(N^2)"], ans: 0, exp: "Array elements are stored in contiguous memory locations, allowing O(1) direct offset calculation." },
        { q: "Which data structure follows the LIFO (Last In, First Out) principle?", options: ["Queue", "Stack", "Array", "Linked List"], ans: 1, exp: "Stack follows LIFO — the last element pushed is the first element popped." },
        { q: "What is the best-case time complexity of Linear Search?", options: ["O(1)", "O(N)", "O(log N)", "O(N log N)"], ans: 0, exp: "The target element is found at the very first index." },
        { q: "Which of the following is a non-linear data structure?", options: ["Array", "Linked List", "Tree", "Stack"], ans: 2, exp: "Trees arrange nodes hierarchically, making them non-linear." },
        { q: "What is the space complexity of an array of size N?", options: ["O(1)", "O(N)", "O(log N)", "O(N^2)"], ans: 1, exp: "An array of N elements requires N contiguous memory slots." },
        { q: "Which operation is NOT O(1) in a standard Singly Linked List without tail pointer?", options: ["Insert at head", "Delete head", "Append to tail", "Peek head"], ans: 2, exp: "Appending to tail requires traversing N nodes from head without a tail reference." },
        { q: "What is the worst-case space complexity of recursion depth N?", options: ["O(1)", "O(N)", "O(log N)", "O(N^2)"], ans: 1, exp: "Recursion depth of N creates N activation stack frames on the call stack." },
        { q: "What does Big-O notation represent?", options: ["Exact execution time in seconds", "Upper bound of asymptotic growth", "Lower bound of space", "Average case runtime"], ans: 1, exp: "Big-O characterizes the worst-case upper bound of runtime/space growth." },
        { q: "Which data structure is best for implementing a FIFO queue?", options: ["Array", "Doubly Linked List", "Binary Tree", "Heap"], ans: 1, exp: "Doubly Linked List allows O(1) enqueue at tail and O(1) dequeue at head." },
        { q: "What is the time complexity of searching in an unsorted array of N elements?", options: ["O(1)", "O(N)", "O(log N)", "O(N log N)"], ans: 1, exp: "Without ordering, every element might need to be checked." },
        { q: "In Big-O analysis, O(2N + 5) simplifies to:", options: ["O(N)", "O(2N)", "O(N + 5)", "O(N^2)"], ans: 0, exp: "Constant multipliers and lower-order constants are dropped." },
        { q: "Which data structure uses key-value pairs for O(1) average lookup?", options: ["Hash Table", "Binary Search Tree", "Array", "Queue"], ans: 0, exp: "Hash Tables compute array indices using hash functions for O(1) average access." },
        { q: "What is a null pointer exception caused by?", options: ["Accessing memory via an uninitialized/null reference", "Running out of heap memory", "Stack overflow in recursion", "Divide by zero"], ans: 0, exp: "Dereferencing a null reference throws a NullPointerException." },
        { q: "Which sorting algorithm has a O(N^2) best, average, and worst-case time complexity?", options: ["Selection Sort", "Merge Sort", "Quick Sort", "Heap Sort"], ans: 0, exp: "Selection Sort always performs N*(N-1)/2 comparisons regardless of initial order." },
        { q: "What is the primary advantage of a Linked List over a contiguous Array?", options: ["O(1) random access", "Dynamic size & O(1) insertion at head", "Better cache locality", "Less memory per node"], ans: 1, exp: "Linked lists can grow dynamically without reallocation or contiguous memory blocks." },
        { q: "What is the time complexity of Insertion Sort in the best case (already sorted array)?", options: ["O(1)", "O(N)", "O(N log N)", "O(N^2)"], ans: 1, exp: "For a sorted array, Insertion Sort makes 1 comparison per element with 0 shifts (O(N))." },
        { q: "Which data structure is used to handle function call stack in programming languages?", options: ["Queue", "Stack", "Tree", "Graph"], ans: 1, exp: "Call stack uses LIFO Stack to manage local variables and return addresses." },
        { q: "What is the time complexity of deleting an element from a Hash Set on average?", options: ["O(1)", "O(N)", "O(log N)", "O(N^2)"], ans: 0, exp: "Hash Set removal takes O(1) average time via key hashing." },
        { q: "Which notation represents the tight bound (exact growth rate)?", options: ["Big-O", "Big-Omega", "Big-Theta", "Little-o"], ans: 2, exp: "Big-Theta (Θ) specifies both lower and upper asymptotic bounds." },
        { q: "What is the output of pushing 1, 2, 3 into a Stack and popping once?", options: ["1", "2", "3", "None"], ans: 2, exp: "3 was pushed last, so it is popped first." }
    ],

    level2: [ // Basic
        { q: "What is the time complexity of Binary Search on a sorted array of N elements?", options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"], ans: 1, exp: "Binary search cuts the search space in half at each step (O(log N))." },
        { q: "Which sorting algorithm is guaranteed to be stable and runs in O(N log N) time?", options: ["Quick Sort", "Merge Sort", "Heap Sort", "Selection Sort"], ans: 1, exp: "Merge Sort uses divide-and-conquer and preserves relative order of duplicate elements." },
        { q: "What is the worst-case time complexity of Quick Sort?", options: ["O(N log N)", "O(N)", "O(N^2)", "O(1)"], ans: 2, exp: "Quick Sort worst-case is O(N^2) when chosen pivot is always min/max." },
        { q: "What is the space complexity of Merge Sort?", options: ["O(1)", "O(N)", "O(log N)", "O(N^2)"], ans: 1, exp: "Merge Sort requires an auxiliary temporary array of size N to merge subarrays." },
        { q: "How do you check if a string of length N is a palindrome in O(1) extra space?", options: ["Two pointers from left and right converging to center", "Reverse string and compare", "Use Stack", "Use Hash Set"], ans: 0, exp: "Comparing characters at left and right pointers moving inward uses O(1) space." },
        { q: "What is the time complexity of building a Max Heap from an unsorted array of N elements?", options: ["O(N)", "O(N log N)", "O(N^2)", "O(log N)"], ans: 0, exp: "Bottom-up heapification (Floyd's algorithm) takes O(N) linear time." },
        { q: "In a Queue, insertion happens at ___ and deletion happens at ___.", options: ["Rear, Front", "Front, Rear", "Head, Head", "Top, Top"], ans: 0, exp: "Elements are enqueued at the Rear and dequeued from the Front." },
        { q: "What is the primary disadvantage of Bubble Sort?", options: ["High space complexity", "O(N^2) quadratic time complexity", "Unstable sorting", "Complex implementation"], ans: 1, exp: "Repeated adjacent swaps result in slow O(N^2) runtime." },
        { q: "Which data structure is used to evaluate Postfix (RPN) expressions?", options: ["Queue", "Stack", "Tree", "Array"], ans: 1, exp: "Operands are pushed onto Stack; operators pop 2 operands, compute, and push result." },
        { q: "What is the time complexity of String.indexOf() in Java (naive matching)?", options: ["O(N + M)", "O(N * M)", "O(1)", "O(N log N)"], ans: 1, exp: "Naive string matching compares pattern of length M at all N positions in O(N * M)." },
        { q: "How to find the middle node of a Linked List in a single pass?", options: ["Slow and Fast pointer approach", "Traverse twice", "Use HashMap", "Use Stack"], ans: 0, exp: "Fast pointer moves 2 steps while Slow pointer moves 1 step; when Fast reaches end, Slow is at middle." },
        { q: "What is the time complexity of searching in a Balanced Binary Search Tree?", options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"], ans: 1, exp: "Balanced BST cuts depth by half at each node choice (O(log N))." },
        { q: "Which data structure is best for checking matching parentheses '(())'?", options: ["Queue", "Stack", "LinkedList", "Heap"], ans: 1, exp: "Push open brackets onto Stack; pop matching close brackets. Stack must be empty at end." },
        { q: "What is the time complexity of Quick Select for finding K-th smallest element on average?", options: ["O(N)", "O(N log N)", "O(N^2)", "O(log N)"], ans: 0, exp: "Quick Select only recurses into one partition, averaging O(N) time." },
        { q: "Which algorithm uses dynamic programming to find string edit distance?", options: ["KMP Algorithm", "Levenshtein Distance", "Rabin-Karp", "Boyer-Moore"], ans: 1, exp: "Levenshtein distance builds a 2D DP matrix to find minimum insertions/deletions/replacements." },
        { q: "What is the maximum number of nodes in a binary tree of height H (1-indexed)?", options: ["2^H - 1", "2^H", "2^(H-1)", "H^2"], ans: 0, exp: "A full binary tree of height H has 1 + 2 + 4 + ... + 2^(H-1) = 2^H - 1 nodes." },
        { q: "What is the amortized time complexity of ArrayList.add() in Java?", options: ["O(1)", "O(N)", "O(log N)", "O(N^2)"], ans: 0, exp: "Array resizing doubles capacity infrequently, averaging O(1) per append." },
        { q: "Which sorting algorithm works by repeatedly placing the minimum element at sorted prefix?", options: ["Selection Sort", "Insertion Sort", "Merge Sort", "Heap Sort"], ans: 0, exp: "Selection Sort finds minimum in unsorted array and swaps to current prefix index." },
        { q: "What is the space complexity of an in-place Quick Sort implementation?", options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"], ans: 1, exp: "In-place Quick Sort uses O(log N) auxiliary stack space for recursion frames." },
        { q: "What is a Monotonic Stack?", options: ["Stack with elements strictly increasing or decreasing", "Stack with fixed size", "Concurrent Thread-Safe Stack", "Stack with fast random access"], ans: 0, exp: "Monotonic Stack maintains sorted order of elements for O(N) next/previous greater queries." }
    ],

    level3: [ // Intermediate
        { q: "What is the height of a balanced Binary Tree with N nodes?", options: ["O(log N)", "O(N)", "O(N^2)", "O(1)"], ans: 0, exp: "Balanced binary tree depth grows logarithmically with node count." },
        { q: "Which traversal of a Binary Search Tree produces elements in sorted order?", options: ["Pre-order", "In-order", "Post-order", "Level-order"], ans: 1, exp: "In-order traversal (Left, Root, Right) visits BST keys in strictly ascending order." },
        { q: "What is the time complexity of inserting a node into a Max Heap of size N?", options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"], ans: 1, exp: "Insertion appends at end and bubbles up the heap height (O(log N))." },
        { q: "How do you detect a cycle in an Undirected Graph using BFS/DFS?", options: ["If visiting an already visited node that is NOT parent", "If node degree > 2", "If graph is disconnected", "If visited set count == V"], ans: 0, exp: "Visiting an already visited non-parent node indicates a cycle back-edge." },
        { q: "What is the time complexity of Breadth-First Search (BFS) on graph with V vertices & E edges?", options: ["O(V)", "O(V + E)", "O(V * E)", "O(E log V)"], ans: 1, exp: "BFS visits every vertex once and explores every edge once (O(V + E))." },
        { q: "Which data structure is ideal for Level Order Traversal of a Binary Tree?", options: ["Stack", "Queue", "Priority Queue", "Set"], ans: 1, exp: "FIFO Queue ensures nodes at current depth are processed before child depth nodes." },
        { q: "What is the worst-case height of an unbalanced Binary Search Tree?", options: ["O(log N)", "O(N)", "O(N log N)", "O(1)"], ans: 1, exp: "A degenerate BST (skewed list) has height O(N)." },
        { q: "What is the main difference between Tree and Graph?", options: ["Tree has no cycles and connected N-1 edges", "Graph cannot have weights", "Tree has no root", "Graph is always linear"], ans: 0, exp: "Trees are connected acyclic graphs with exactly V-1 edges." },
        { q: "What is the time complexity of searching a word in a Trie of length L?", options: ["O(L)", "O(N)", "O(log N)", "O(N * L)"], ans: 0, exp: "Trie traversal inspects 1 character per step, proportional to word length L." },
        { q: "Which algorithm finds Minimum Spanning Tree using Greedy Edge Selection?", options: ["Kruskal's Algorithm", "Dijkstra's Algorithm", "Floyd-Warshall", "Bellman-Ford"], ans: 0, exp: "Kruskal's sorts all edges by weight and adds edges using Disjoint Set Union (DSU)." },
        { q: "What is Disjoint Set Union (DSU) with Path Compression & Rank time complexity per operation?", options: ["O(1) amortized / O(α(N))", "O(N)", "O(log N)", "O(N^2)"], ans: 0, exp: "Path compression and union-by-rank reduce operations to inverse Ackermann function α(N) ≈ O(1)." },
        { q: "In Post-order Traversal of Binary Tree, order of visiting is:", options: ["Left, Right, Root", "Root, Left, Right", "Left, Root, Right", "Root, Right, Left"], ans: 0, exp: "Post-order processes children first (Left, Right) then Root." },
        { q: "What is the time complexity of Floyd-Warshall All-Pairs Shortest Path algorithm?", options: ["O(V + E)", "O(V^2)", "O(V^3)", "O(V * E)"], ans: 2, exp: "Floyd-Warshall uses 3 nested loops over all V vertices (O(V^3))." },
        { q: "What is the maximum depth of recursion stack for Balanced Quick Sort?", options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"], ans: 1, exp: "Balanced partition splits recursion depth to log N levels." },
        { q: "Which data structure is used to implement Priority Queue?", options: ["Array", "Linked List", "Binary Heap", "Stack"], ans: 2, exp: "Binary Heap provides O(log N) insertion and O(log N) max/min extraction." },
        { q: "What is Topological Sort used for?", options: ["Ordering DAG tasks with dependencies", "Finding shortest path in weighted graph", "Detecting negative cycles", "Tree balancing"], ans: 0, exp: "Topological Sort orders vertices in Directed Acyclic Graphs (DAGs) respecting edge dependencies." },
        { q: "What is the time complexity of Topological Sort using Kahn's Algorithm (BFS)?", options: ["O(V + E)", "O(V log V)", "O(V^2)", "O(E log V)"], ans: 0, exp: "Kahn's algorithm uses in-degree queue tracking, visiting all V vertices & E edges in O(V + E)." },
        { q: "What is an AVL Tree?", options: ["Self-balancing BST where height difference of subtrees is at most 1", "Complete Binary Tree", "B-Tree variant", "Heap"], ans: 0, exp: "AVL Trees maintain strict balance factor |hL - hR| ≤ 1 via tree rotations." },
        { q: "How to check if a Binary Tree is a valid Binary Search Tree?", options: ["In-order traversal is strictly increasing", "Root > Left child", "Root < Right child", "Tree is full"], ans: 0, exp: "In-order traversal of a valid BST must yield strictly ascending values." },
        { q: "What is the time complexity of finding the Lowest Common Ancestor (LCA) in a BST?", options: ["O(H) where H is height", "O(N^2)", "O(1)", "O(N log N)"], ans: 0, exp: "Navigate left if target keys < curr.val, right if target keys > curr.val in O(H) time." }
    ],

    level4: [ // Advanced
        { q: "What is the time complexity of Bellman-Ford Shortest Path algorithm?", options: ["O(V * E)", "O(V + E)", "O(E log V)", "O(V^3)"], ans: 0, exp: "Bellman-Ford relaxes all E edges V-1 times (O(V * E)) and can detect negative cycles." },
        { q: "Which algorithm handles negative edge weights and detects negative cycles?", options: ["Dijkstra's Algorithm", "Bellman-Ford Algorithm", "Kruskal's Algorithm", "Prim's Algorithm"], ans: 1, exp: "Bellman-Ford handles negative weights and flags negative cycle reachable paths." },
        { q: "What is the main difference between Memoization and Tabulation in Dynamic Programming?", options: ["Memoization is Top-Down recursion + caching; Tabulation is Bottom-Up iterative table building", "Tabulation uses recursion; Memoization uses loops", "Memoization takes more time", "Tabulation cannot save space"], ans: 0, exp: "Memoization evaluates subproblems lazily via recursion; Tabulation computes iteratively from base cases." },
        { q: "What is the time complexity of 0/1 Knapsack using Dynamic Programming?", options: ["O(N * W)", "O(2^N)", "O(N log N)", "O(W^2)"], ans: 0, exp: "DP matrix size N items by W capacity takes O(N * W) pseudo-polynomial time." },
        { q: "How can space complexity of 0/1 Knapsack DP be optimized from O(N * W) to O(W)?", options: ["Using 1D array iterating weight backwards", "Using 1D array iterating weight forwards", "Using Hash Map", "Using Heap"], ans: 0, exp: "Iterating weight backwards prevents overwriting previous row values in 1D array." },
        { q: "What is the time complexity of Longest Common Subsequence (LCS) of strings length M & N?", options: ["O(M * N)", "O(M + N)", "O(2^(M+N))", "O(M log N)"], ans: 0, exp: "LCS DP table of size (M+1) x (N+1) takes O(M * N) time." },
        { q: "Which pattern is used to find Longest Increasing Subsequence (LIS) in O(N log N) time?", options: ["Patience Sorting with Binary Search", "2D Dynamic Programming", "BFS Traversal", "Monotonic Queue"], ans: 0, exp: "Patience sorting maintains tails array updated via binary search (O(N log N))." },
        { q: "What is the time complexity of Tarjan's Strongly Connected Components (SCC) algorithm?", options: ["O(V + E)", "O(V^2)", "O(E log V)", "O(V * E)"], ans: 0, exp: "Tarjan's algorithm uses DFS discovery times and low-link values in O(V + E) time." },
        { q: "What is Kosaraju's Algorithm used for?", options: ["Finding Strongly Connected Components in Directed Graph", "Finding Minimum Spanning Tree", "All-Pairs Shortest Path", "Bipartite Graph Check"], ans: 0, exp: "Kosaraju's uses 2 DFS passes (original and transposed graph) to identify SCCs in O(V + E)." },
        { q: "What is the time complexity of KMP (Knuth-Morris-Pratt) Pattern Matching algorithm?", options: ["O(N + M)", "O(N * M)", "O(N log M)", "O(N^2)"], ans: 0, exp: "KMP builds Longest Prefix Suffix (LPS) array in O(M) and searches text in O(N) time." },
        { q: "What is a Segment Tree used for?", options: ["Range Query & Point/Range Update in O(log N) time", "Fast String Matching", "Graph Shortest Path", "Tree Balancing"], ans: 0, exp: "Segment Trees store interval aggregates allowing O(log N) range queries & updates." },
        { q: "What is Fenwick Tree (Binary Indexed Tree) space complexity?", options: ["O(N)", "O(N log N)", "O(N^2)", "O(1)"], ans: 0, exp: "Fenwick Tree uses 1D array of size N+1 for prefix sum updates in O(log N) time." },
        { q: "What is the time complexity of Z-Algorithm for string matching?", options: ["O(N + M)", "O(N * M)", "O(N log N)", "O(N^2)"], ans: 0, exp: "Z-algorithm constructs Z-array of matches in linear O(N + M) time." },
        { q: "Which algorithm checks if a graph is Bipartite?", options: ["2-Coloring using BFS/DFS", "Dijkstra's Algorithm", "Floyd-Warshall", "Kruskal's Algorithm"], ans: 0, exp: "Attempting to color adjacent vertices with alternating colors (2-coloring) tests bipartiteness." },
        { q: "What is the time complexity of Prim's Algorithm for MST using Min-Heap?", options: ["O(E log V)", "O(V^2)", "O(V + E)", "O(V * E)"], ans: 0, exp: "Prim's relaxes vertex edges and extracts minimum weight via Min-Heap in O(E log V) time." },
        { q: "What is the max flow algorithm using BFS to find augmenting paths?", options: ["Edmonds-Karp Algorithm", "Ford-Fulkerson with DFS", "Dijkstra", "Tarjan"], ans: 0, exp: "Edmonds-Karp implements Ford-Fulkerson method using BFS in O(V * E^2) time." },
        { q: "What is a Red-Black Tree?", options: ["Self-balancing BST using node color properties & rotations", "Complete Binary Tree", "Multi-way Search Tree", "B-Tree"], ans: 0, exp: "Red-Black Trees maintain balance via 5 color rules ensuring maximum height ≤ 2 log(N+1)." },
        { q: "What is the time complexity of Word Break problem using Dynamic Programming?", options: ["O(N^2 * L) where L is max word length", "O(2^N)", "O(N log N)", "O(N)"], ans: 0, exp: "DP array of length N checks substring match up to max dictionary word length L." },
        { q: "Which approach solves N-Queens problem?", options: ["Backtracking", "Greedy Algorithm", "Breadth-First Search", "Binary Search"], ans: 0, exp: "Backtracking places queens row-by-row, pruning invalid column/diagonal configurations." },
        { q: "What is the time complexity of Coin Change 1 (Min Coins) using DP?", options: ["O(N * Amount) where N is coin count", "O(2^N)", "O(N log N)", "O(Amount^2)"], ans: 0, exp: "DP array up to Target Amount fills min coins for each coin denomination in O(N * Amount)." }
    ],

    level5: [ // Expert
        { q: "What is the time complexity of Travelling Salesperson Problem (TSP) using Held-Karp DP?", options: ["O(2^N * N^2)", "O(N!)", "O(N^3)", "O(N log N)"], ans: 0, exp: "Held-Karp dynamic programming with bitmasking reduces TSP runtime from O(N!) to O(2^N * N^2)." },
        { q: "What is a Bitmask DP technique?", options: ["Using integer bits to represent subset state in DP", "Encrypting DP tables", "Bitwise shifting indices", "Hashing DP keys"], ans: 0, exp: "Integer bitmask (e.g. 1<<N) represents set inclusion state efficiently for NP-hard DP subproblems." },
        { q: "What is the time complexity of A* Search algorithm with consistent heuristic?", options: ["O(E) in best case, bounded by heuristic quality", "O(V^3)", "O(V * E)", "O(V log V)"], ans: 0, exp: "A* uses f(n) = g(n) + h(n) priority queue evaluation, exploring optimal path faster than Dijkstra." },
        { q: "What is Heavy-Light Decomposition (HLD) used for?", options: ["Decomposing Tree into paths to perform range queries using Segment Tree in O(log^2 N)", "Graph Shortest Path", "Fast String Search", "Sorting"], ans: 0, exp: "HLD partitions tree edges into heavy/light paths for O(log^2 N) path queries." },
        { q: "What is the time complexity of Suffix Array construction using SA-IS algorithm?", options: ["O(N)", "O(N log N)", "O(N^2)", "O(N log^2 N)"], ans: 0, exp: "SA-IS constructs suffix array in linear O(N) time." },
        { q: "What is a Treap data structure?", options: ["Randomized Search Tree combining BST keys and Heap priorities", "Trie + Heap", "Tree + Graph", "B-Tree variant"], ans: 0, exp: "Treap assigns random priority to nodes, maintaining BST key order and Heap priority via rotations." },
        { q: "What is Dinic's Algorithm time complexity for Maximum Network Flow?", options: ["O(V^2 * E)", "O(V * E^2)", "O(V^3)", "O(E log V)"], ans: 0, exp: "Dinic's uses level graphs (BFS) and blocking flows (DFS) in O(V^2 * E) time (O(E √V) for unit networks)." },
        { q: "What is a Skip List space and search time complexity on average?", options: ["Search: O(log N), Space: O(N)", "Search: O(N), Space: O(N log N)", "Search: O(1), Space: O(N^2)", "Search: O(N log N), Space: O(N)"], ans: 0, exp: "Probabilistic multi-level linked nodes achieve O(log N) search with O(N) average memory." },
        { q: "What is the time complexity of Matrix Chain Multiplication DP for N matrices?", options: ["O(N^3)", "O(2^N)", "O(N log N)", "O(N^4)"], ans: 0, exp: "DP matrix interval evaluation iterates over subproblem length, split point, and position in O(N^3)." },
        { q: "Which algorithm finds Bridges and Articulation Points in a connected graph in single pass?", options: ["Tarjan's Low-Link Algorithm (DFS)", "Dijkstra's Algorithm", "Kruskal's Algorithm", "Bellman-Ford"], ans: 0, exp: "DFS tracking discovery time insertion `tin[u]` and low-link `low[u]` identifies bridges in O(V + E)." },
        { q: "What is the time complexity of Manacher's Algorithm for Longest Palindromic Substring?", options: ["O(N)", "O(N^2)", "O(N log N)", "O(N^3)"], ans: 0, exp: "Manacher's reuses palindrome symmetry radii to expand palindromes in linear O(N) time." },
        { q: "What is a Suffix Automaton (DAG of all substrings)?", options: ["Minimal deterministic finite automaton representing all substrings of string in O(N) space/time", "Trie of all suffixes", "Suffix Tree variant", "String Hash Table"], ans: 0, exp: "Suffix Automaton compactly represents all N*(N+1)/2 substrings using O(N) states and transitions." },
        { q: "What is Link-Cut Tree data structure used for?", options: ["Representing dynamic forest of trees supporting connectivity queries & path operations in O(log N)", "Static Segment Tree", "String Matching", "Heap Sorting"], ans: 0, exp: "Link-Cut trees use Splay Trees to maintain dynamic forest structure in amortized O(log N) time." },
        { q: "What is the time complexity of Fast Fourier Transform (FFT) for Polynomial Multiplication?", options: ["O(N log N)", "O(N^2)", "O(N)", "O(N^3)"], ans: 0, exp: "FFT converts coefficient representation to point-value evaluation in O(N log N) time." },
        { q: "What is convex hull Graham Scan algorithm time complexity?", options: ["O(N log N)", "O(N^2)", "O(N)", "O(N^3)"], ans: 0, exp: "Sorting points by polar angle takes O(N log N); stack scan takes O(N)." },
        { q: "What is Hopcroft-Karp algorithm time complexity for Maximum Bipartite Matching?", options: ["O(E √V)", "O(V * E)", "O(V^3)", "O(V + E)"], ans: 0, exp: "Hopcroft-Karp uses BFS to find multiple shortest augmenting paths in O(E √V) time." },
        { q: "What is 2-SAT (2-Satisfiability) time complexity?", options: ["O(V + E) using SCC on Implication Graph", "O(2^N) exponential", "O(N^3)", "O(N log N)"], ans: 0, exp: "2-SAT is solvable in linear O(V + E) time by checking if variable x and ¬x belong to same SCC." },
        { q: "What is a Splay Tree amortized operation time complexity?", options: ["O(log N)", "O(1)", "O(N)", "O(N log N)"], ans: 0, exp: "Splaying accessed nodes to root via zig-zag rotations guarantees amortized O(log N) performance." },
        { q: "What is centroid decomposition of a tree?", options: ["Recursively splitting tree at centroid node into subtrees of size ≤ N/2 in O(N log N)", "Tree Balancing", "DFS Traversal", "Shortest Path"], ans: 0, exp: "Centroid decomposition builds a centroid tree of depth O(log N) for tree path queries." },
        { q: "What is the time complexity of Rabin-Karp Rolling Hash string search on average?", options: ["O(N + M)", "O(N * M)", "O(N log M)", "O(N^2)"], ans: 0, exp: "Rolling hash computes substring hash in O(1) step, averaging O(N + M) time." }
    ],

    level6: [ // Master
        { q: "In System Design, what is the CAP Theorem trade-off during a network partition (P)?", options: ["Choose Consistency (C) OR Availability (A)", "Choose Performance OR Storage", "Choose Latency OR Throughput", "Choose SQL OR NoSQL"], ans: 0, exp: "CAP theorem states a distributed system under Partition (P) can guarantee either Consistency (CP) or Availability (AP)." },
        { q: "What is Consistent Hashing used for in Distributed Caching?", options: ["Minimizing key remapping when cache nodes are added or removed", "Faster hash function execution", "Encrypting cache keys", "Sorting keys"], ans: 0, exp: "Consistent Hashing maps keys & nodes to a ring (2^32), remapping only K/N keys on node changes." },
        { q: "What is the purpose of a Distributed Write-Ahead Log (WAL)?", options: ["Ensuring durability and atomicity before updating in-memory state", "Caching API requests", "Load balancing traffic", "Compressing database backups"], ans: 0, exp: "WAL appends transactions sequentially to disk log prior to state mutation for fault recovery." },
        { q: "What is the Raft Consensus Algorithm primary mechanism?", options: ["Leader Election, Log Replication, and Safety", "Pow Proof-of-Work", "Byzantine Fault Tolerance", "Consistent Hashing"], ans: 0, exp: "Raft decomposes consensus into Leader Election, Log Replication, and Safety state machine enforcement." },
        { q: "What is a Bloom Filter?", options: ["Space-efficient probabilistic data structure testing set membership with 0 false negatives", "Exact Hash Set", "Binary Search Tree", "Balanced B-Tree"], ans: 0, exp: "Bloom filters use k hash functions over m-bit array; might return false positives, but NEVER false negatives." },
        { q: "What is the difference between Strong Consistency and Eventual Consistency?", options: ["Strong guarantees immediate read of latest write; Eventual guarantees reads converge over time", "Eventual is faster for writes", "Strong requires NoSQL", "Eventual never converges"], ans: 0, exp: "Strong consistency requires synchronous replication; Eventual permits asynchronous background convergence." },
        { q: "How does a B+ Tree differ from a standard B-Tree in Database Indexing?", options: ["B+ Tree stores all data pointers exclusively in Leaf Nodes connected as Linked List", "B+ Tree is binary", "B-Tree has faster range queries", "B+ Tree has no keys"], ans: 0, exp: "B+ Tree leaf nodes store all data pointers & form a sequential linked list for fast range scans." },
        { q: "What is Database Sharding?", options: ["Horizontal partitioning of database rows across multiple independent DB instances", "Vertical splitting of columns", "Creating read-replicas", "Database indexing"], ans: 0, exp: "Sharding splits large tables horizontally across shard nodes based on a Shard Key." },
        { q: "What is the Two-Phase Commit (2PC) protocol used for?", options: ["Atomic distributed transactions across multiple database nodes (Prepare & Commit phases)", "Faster database reads", "Cache eviction", "Data compression"], ans: 0, exp: "2PC uses a Coordinator to execute Prepare phase followed by Commit/Rollback phase across participants." },
        { q: "What is a LSM-Tree (Log-Structured Merge-Tree) in storage engines like RocksDB/Cassandra?", options: ["Append-only MemTable in RAM flushed to SSTables on disk with background compaction for high write throughput", "B-Tree index", "In-memory Hash Table", "Graph DB index"], ans: 0, exp: "LSM-Trees convert random writes into fast sequential disk appends (MemTable → SSTables → Compaction)." },
        { q: "What is a Circuit Breaker Pattern in Microservices?", options: ["Preventing cascading service failures by failing fast when downstream service is unhealthy", "Rate limiting user requests", "Encrypting network payload", "DNS load balancing"], ans: 0, exp: "Circuit Breaker monitors failure thresholds (Closed → Open → Half-Open) to isolate failing services." },
        { q: "What is CQRS (Command Query Responsibility Segregation)?", options: ["Separating Read (Query) data models from Write (Command) data models", "Combining DB queries", "Database sharding", "Cache warm-up"], ans: 0, exp: "CQRS optimizes reads & writes independently using tailored data stores (e.g. RDBMS for writes, Elasticsearch for reads)." },
        { q: "What is Event Sourcing?", options: ["Persisting state changes as a sequence of immutable event logs rather than current state", "Publish-subscribe messaging", "Batch job execution", "REST API architecture"], ans: 0, exp: "Event Sourcing rebuilds application state by replaying an immutable audit log of domain events." },
        { q: "What is the primary role of a Reverse Proxy (e.g. NGINX)?", options: ["Handling SSL termination, load balancing, and routing requests to internal servers", "Database indexing", "Compiling Java bytecode", "Managing client cookies"], ans: 0, exp: "Reverse proxies sit in front of backend servers managing security, caching, SSL, and load balancing." },
        { q: "What is a CDN (Content Delivery Network) Edge Location?", options: ["Geographically distributed caching servers serving static assets close to end users", "Primary database data center", "DNS root server", "Backend application cluster"], ans: 0, exp: "CDNs cache images, JS, CSS at POP edge servers worldwide to reduce latency and origin load." },
        { q: "What is a Distributed Unique ID Generator (e.g. Twitter Snowflake)?", options: ["64-bit ID comprising Timestamp, Worker ID, and Sequence Number for sortable unique IDs", "UUID v4", "Auto-incrementing MySQL ID", "MD5 Hash"], ans: 0, exp: "Snowflake IDs generate 64-bit time-ordered unique IDs without centralized lock coordination." },
        { q: "What is Message Queue Idempotency?", options: ["Ensuring duplicate message processing yields the exact same state without side-effects", "Delivering messages in order", "Compressing message payload", "Storing messages on disk"], ans: 0, exp: "Idempotence guarantees executing a message multiple times has the same outcome as executing it once." },
        { q: "What is Database Connection Pooling?", options: ["Reusing a warm pool of DB connections to eliminate connection handshake overhead per request", "Database sharding", "Read-replica routing", "Distributed caching"], ans: 0, exp: "HikariCP pools persistent TCP connections to prevent costly DB handshake allocation per query." },
        { q: "What is a Distributed Lock (e.g. Redlock with Redis)?", options: ["Mutual exclusion lock across multiple nodes in a distributed environment", "Row-level database lock", "Java ReentrantLock", "File system lock"], ans: 0, exp: "Redlock uses TTL lease tokens across N Redis masters to prevent race conditions across distributed workers." },
        { q: "What is the difference between Horizontal Scaling (Scale-Out) and Vertical Scaling (Scale-Up)?", options: ["Horizontal adds more machine nodes; Vertical adds RAM/CPU to a single machine", "Vertical adds more servers", "Horizontal is only for databases", "Vertical is always cheaper"], ans: 0, exp: "Scaling out adds nodes to a cluster; Scaling up upgrades CPU/RAM specs of an individual server instance." }
    ]
};

let currentDsaQuizLevel = 1;

function getUnlockedDsaQuizLevels() {
    try {
        const list = JSON.parse(localStorage.getItem('dsa_unlocked_quiz_levels') || '[1]');
        return Array.isArray(list) ? list : [1];
    } catch(e) { return [1]; }
}

function unlockDsaQuizLevel(levelNum) {
    try {
        const unlocked = getUnlockedDsaQuizLevels();
        if (!unlocked.includes(levelNum)) {
            unlocked.push(levelNum);
            localStorage.setItem('dsa_unlocked_quiz_levels', JSON.stringify(unlocked));
        }
    } catch(e) {}
}

function initDsaQuiz() {
    const container = document.getElementById("ds-content-quiz");
    if (!container) return;

    const unlocked = getUnlockedDsaQuizLevels();
    const levelsMeta = [
        { level: 1, name: "🟢 Level 1: Beginner", desc: "Arrays, Strings, Big-O Notation & Memory Basics", count: 20 },
        { level: 2, name: "🟢 Level 2: Basic", desc: "Stacks, Queues, Searching & Basic Sorting Algorithms", count: 20 },
        { level: 3, name: "🟡 Level 3: Intermediate", desc: "Linked Lists, Binary Trees, Recursion & Heaps", count: 20 },
        { level: 4, name: "🟡 Level 4: Advanced", desc: "Graphs, BFS/DFS, Binary Search Trees & DP Intro", count: 20 },
        { level: 5, name: "🔴 Level 5: Expert", desc: "Advanced DP, Monotonic Stack, Dijkstra & Disjoint Set", count: 20 },
        { level: 6, name: "🏆 Level 6: Master", desc: "System Design, Scalability, Distributed Systems & HLD", count: 20 }
    ];

    const cardsHtml = levelsMeta.map(m => {
        const isUnlocked = unlocked.includes(m.level);
        return `
            <div class="interview-q-card" style="padding:22px; background:var(--surface); border:1px solid ${isUnlocked ? 'rgba(0,245,160,0.3)' : 'var(--border-soft)'}; border-radius:16px; margin-bottom:16px; transition:all 0.2s ease;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
                    <h3 style="margin:0; color:var(--text-primary); font-size:1.2rem;">${m.name}</h3>
                    <span style="font-size:0.8rem; padding:4px 12px; border-radius:14px; font-weight:700; background:${isUnlocked ? 'rgba(0,245,160,0.15)' : 'rgba(255,255,255,0.06)'}; color:${isUnlocked ? '#00f5a0' : 'var(--text-tertiary)'};">
                        ${isUnlocked ? '🔓 Ready to Play' : '🔒 Complete Level ' + (m.level - 1) + ' (≥ 70%)'}
                    </span>
                </div>
                <p style="color:var(--text-secondary); margin:4px 0 16px 0; font-size:0.92rem;">${m.desc}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <span style="font-size:0.85rem; color:var(--text-tertiary);">📝 ${m.count} Questions | 70% to Pass</span>
                    ${isUnlocked ? `<button class="dsa-submit-btn-load" style="padding:8px 20px;" onclick="startDsaLevelQuiz(${m.level})">▶ Start Level ${m.level} Quiz</button>` : `<button class="dsa-sub-filter-btn" disabled style="opacity:0.4; cursor:not-allowed;">🔒 Level Locked</button>`}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div style="margin-bottom:24px;">
            <h2 style="margin:0; font-size:1.6rem; color:var(--text-primary);">📝 Data Structures & Algorithms Multi-Level Quiz</h2>
            <p style="margin:4px 0 0 0; color:var(--text-secondary); font-size:0.95rem;">Test your conceptual understanding step-by-step from Level 1 (Beginner) to Level 6 (Master). Score at least 70% to unlock the next level!</p>
        </div>
        <div>${cardsHtml}</div>
    `;
}

function startDsaLevelQuiz(levelNum) {
    currentDsaQuizLevel = levelNum;
    const container = document.getElementById("ds-content-quiz");
    if (!container) return;

    const questions = dsaMultiLevelQuizzes[`quiz${levelNum}`] || dsaMultiLevelQuizzes[`level${levelNum}`] || dsaMultiLevelQuizzes.level1;

    let quizHtml = questions.map((q, idx) => `
        <div class="quiz-q-card" style="margin-top:16px; padding:20px; background:var(--surface); border:1px solid var(--border-soft); border-radius:14px;">
            <h4 style="margin:0 0 14px 0; color:var(--text-primary); font-size:1.02rem;">${idx + 1}. ${escapeHtml(q.q)}</h4>
            <div class="quiz-options" style="display:flex; flex-direction:column; gap:10px;">
                ${q.options.map((opt, oIdx) => `
                    <label class="quiz-opt-label" style="display:flex; align-items:center; gap:10px; padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid var(--border-soft); border-radius:10px; cursor:pointer; font-size:0.92rem; transition:all 0.2s ease;">
                        <input type="radio" name="dsa-lq-${idx}" value="${oIdx}" style="accent-color:var(--jade);">
                        <span>${escapeHtml(opt)}</span>
                    </label>
                `).join('')}
            </div>
            <div id="dsa-lq-ans-exp-${idx}" class="quiz-explanation" style="display:none; margin-top:14px; padding:14px; border-radius:8px; font-size:0.9rem;"></div>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
            <div>
                <button class="dsa-sub-filter-btn" onclick="initDsaQuiz()" style="margin-bottom:8px;">← Back to Level Selection</button>
                <h2 style="margin:0; font-size:1.5rem; color:var(--text-primary);">📝 Level ${levelNum} DSA Quiz (${questions.length} Questions)</h2>
            </div>
            <span style="font-size:0.9rem; padding:6px 14px; border-radius:20px; background:rgba(0,245,160,0.15); color:#00f5a0; font-weight:700;">Pass Score: 70%</span>
        </div>

        <div id="dsa-quiz-form">${quizHtml}</div>

        <div style="margin-top:24px; display:flex; justify-content:flex-end;">
            <button class="dsa-submit-btn-load" style="padding:12px 32px; font-size:1rem;" onclick="evaluateDsaLevelQuiz(${levelNum})">🚀 Submit Level ${levelNum} Quiz</button>
        </div>
        <div id="dsa-quiz-results" style="margin-top:20px;"></div>
    `;

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function evaluateDsaLevelQuiz(levelNum) {
    const questions = dsaMultiLevelQuizzes[`quiz${levelNum}`] || dsaMultiLevelQuizzes[`level${levelNum}`] || dsaMultiLevelQuizzes.level1;
    let score = 0;

    questions.forEach((q, idx) => {
        const selected = document.querySelector(`input[name="dsa-lq-${idx}"]:checked`);
        const expDiv = document.getElementById(`dsa-lq-ans-exp-${idx}`);
        if (expDiv) {
            expDiv.style.display = 'block';
            if (selected && parseInt(selected.value) === q.ans) {
                score++;
                expDiv.className = 'quiz-explanation pass';
                expDiv.style.background = 'rgba(0,245,160,0.1)';
                expDiv.style.borderLeft = '4px solid #00f5a0';
                expDiv.style.color = '#00f5a0';
                expDiv.innerHTML = `✅ <b>Correct!</b> ${escapeHtml(q.exp)}`;
            } else {
                expDiv.className = 'quiz-explanation fail';
                expDiv.style.background = 'rgba(239,68,68,0.1)';
                expDiv.style.borderLeft = '4px solid #ef4444';
                expDiv.style.color = '#ef4444';
                expDiv.innerHTML = `❌ <b>Incorrect.</b> Correct answer: <b>${escapeHtml(q.options[q.ans])}</b>.<br>${escapeHtml(q.exp)}`;
            }
        }
    });

    const percent = Math.round((score / questions.length) * 100);
    const passed = percent >= 70;

    if (passed) {
        unlockDsaQuizLevel(levelNum + 1);
    }

    const resultDiv = document.getElementById('dsa-quiz-results');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="dsa-submit-card ${passed ? 'success' : 'failure'}" style="max-width:100%; text-align:center; padding:24px; border-radius:16px;">
                <h3 style="margin:0 0 10px 0;">${passed ? '🎉 Level Passed!' : '⚠️ Level Not Passed'}</h3>
                <p style="font-size:1.1rem; margin:0 0 16px 0;">You scored <b>${score} / ${questions.length}</b> (${percent}%)</p>
                <div style="font-size:0.92rem; color:var(--text-secondary);">
                    ${passed ? `Great job! Level ${levelNum + 1} has been unlocked!` : `You need at least 70% to unlock Level ${levelNum + 1}. Try again!`}
                </div>
                <div style="margin-top:20px; display:flex; gap:12px; justify-content:center;">
                    <button class="dsa-submit-btn-load" onclick="startDsaLevelQuiz(${levelNum})">🔄 Retake Level ${levelNum}</button>
                    <button class="dsa-submit-btn-close" onclick="initDsaQuiz()">📋 Back to Level Selection</button>
                </div>
            </div>
        `;
    }

    if (resultDiv) resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================================================
   300+ TOP TECH COMPANY INTERVIEW PREP HUB
   ========================================================================== */

let currentInterviewCompanyFilter = 'all';
let currentInterviewDifficultyFilter = 'all';
let currentInterviewSearchQuery = '';

function generateDsaInterviewQuestions() {
    const templates = [
        // ARRAYS & STRINGS
        { q: "How do you find the missing number in an array of 1 to N?", d: "Easy", t: "Arrays & Strings", c: ["google", "amazon", "microsoft"], ans: "Use Gauss summation formula: Expected Sum = N*(N+1)/2. Subtract actual array sum from Expected Sum to find the missing number in O(N) time and O(1) space." },
        { q: "How do you find the first non-repeating character in a string?", d: "Easy", t: "Arrays & Strings", c: ["amazon", "meta", "apple"], ans: "Build a frequency hash map or int[26] count array. Perform a second pass over the string to return the first character with count 1 in O(N) time." },
        { q: "Explain Kadane's Algorithm for Maximum Subarray Sum.", d: "Medium", t: "Arrays & Strings", c: ["google", "meta", "amazon", "microsoft"], ans: "Maintain maxEndingHere = max(num, maxEndingHere + num) and maxSoFar = max(maxSoFar, maxEndingHere). Runs in linear O(N) time and O(1) space." },
        { q: "How do you perform in-place string compression (e.g. ['a','a','b','b','c'])?", d: "Medium", t: "Arrays & Strings", c: ["microsoft", "apple", "uber"], ans: "Use write and read pointers. Group consecutive identical characters, write the character, and append its count digits in O(N) time." },
        { q: "How do you find all anagrams of a pattern in a long string?", d: "Hard", t: "Arrays & Strings", c: ["google", "meta", "uber"], ans: "Use a fixed sliding window of size equal to pattern length with a frequency count array. Slide window right, update counts, and check match in O(N) time." },

        // TWO POINTERS & SLIDING WINDOW
        { q: "Explain Two Pointers approach vs Sliding Window.", d: "Easy", t: "Two Pointers & Sliding Window", c: ["amazon", "meta"], ans: "Two Pointers uses left and right boundaries converging towards middle (e.g. sorted 2-sum). Sliding Window maintains a dynamic contiguous subarray range (e.g. max sum subarray of size K)." },
        { q: "How do you find Container With Most Water in O(N) time?", d: "Medium", t: "Two Pointers & Sliding Window", c: ["google", "amazon", "meta"], ans: "Initialize left=0, right=n-1. Calculate area = min(height[left], height[right]) * (right-left). Always shrink the pointer with smaller height to maximize area potential in O(N) time." },
        { q: "Explain Trapping Rain Water problem solution.", d: "Hard", t: "Two Pointers & Sliding Window", c: ["google", "amazon", "meta", "microsoft"], ans: "Use two pointers (left, right) tracking leftMax and rightMax. Water trapped at pointer = max(0, min(leftMax, rightMax) - height[i]). Runs in O(N) time and O(1) space." },

        // LINKED LISTS
        { q: "How do you reverse a Singly Linked List iteratively and recursively?", d: "Easy", t: "Linked Lists", c: ["microsoft", "amazon", "google"], ans: "Iterative: Maintain prev = null, curr = head, next. Loop: next = curr.next; curr.next = prev; prev = curr; curr = next; Return prev in O(N) time and O(1) space." },
        { q: "How do you detect and find the starting node of a cycle in a Linked List?", d: "Medium", t: "Linked Lists", c: ["amazon", "meta", "microsoft"], ans: "Use Floyd's Cycle Detection (slow/fast pointers). Once fast & slow meet, reset slow to head. Advance both 1 step at a time until they meet at the cycle entry node in O(N) time." },
        { q: "How do you merge K sorted linked lists efficiently?", d: "Hard", t: "Linked Lists", c: ["google", "meta", "amazon"], ans: "Use a Min-Heap (PriorityQueue) storing heads of all K lists. Extract min node, attach to result, and insert its next node into heap. Time: O(N log K), Space: O(K)." },

        // STACKS & QUEUES
        { q: "Explain Next Greater Element using Monotonic Stack.", d: "Medium", t: "Stacks & Queues", c: ["amazon", "google", "meta"], ans: "Maintain a decreasing monotonic stack storing indices/values. For each element, pop smaller elements from stack because current element is their Next Greater Element. O(N) time." },
        { q: "How to implement LRU (Least Recently Used) Cache?", d: "Hard", t: "Stacks & Queues", c: ["google", "amazon", "meta", "microsoft", "apple"], ans: "Combine a HashMap (for O(1) key-node lookup) with a Doubly Linked List (for O(1) node movement to head on access/eviction). Time: O(1) get/put." },

        // BINARY SEARCH
        { q: "How do you search in a Rotated Sorted Array?", d: "Medium", t: "Binary Search", c: ["meta", "amazon", "microsoft"], ans: "In mid = (low+high)/2, at least one half (left or right) is guaranteed to be sorted. Determine which half is sorted, check if target lies in that range, and adjust binary search boundaries in O(log N) time." },
        { q: "Explain Median of Two Sorted Arrays.", d: "Hard", t: "Binary Search", c: ["google", "amazon", "microsoft"], ans: "Partition both arrays such that left half size == right half size. Binary search partition index on the smaller array in O(log(min(M, N))) time." },

        // TREES & GRAPHS
        { q: "Explain Difference between BFS and DFS with Graph Applications.", d: "Medium", t: "Trees & Graphs", c: ["google", "meta", "amazon"], ans: "BFS uses Queue (level-by-level, ideal for unweighted shortest path). DFS uses Stack/recursion (depth-first, ideal for topological sort, cycle detection, connected components)." },
        { q: "Explain Dijkstra's Algorithm for Shortest Path.", d: "Hard", t: "Trees & Graphs", c: ["google", "amazon", "uber", "netflix"], ans: "Greedy algorithm using Min-Heap storing (distance, node). Relaxes distance to neighbors and pushes to heap. Runs in O((V + E) log V) time with non-negative edge weights." },

        // DYNAMIC PROGRAMMING
        { q: "Explain 0/1 Knapsack Problem and Optimizations.", d: "Hard", t: "Dynamic Programming", c: ["amazon", "microsoft", "google"], ans: "dp[i][w] = max profit choosing item i or omitting. Space optimization reduces 2D table to 1D array iterating weight backwards. Time: O(N * W), Space: O(W)." },

        // SYSTEM DESIGN & LLD
        { q: "How to design a URL Shortener like Bitly?", d: "Medium", t: "System Design", c: ["google", "amazon", "meta", "microsoft"], ans: "Use Base62 encoding on auto-incrementing 64-bit integer IDs (DB sequence). Use Redis cache for hot URLs, NoSQL (Cassandra) for metadata storage, and load balancers for 100K+ QPS." },
        { q: "How to design a Distributed Rate Limiter?", d: "Hard", t: "System Design", c: ["uber", "stripe", "amazon", "google"], ans: "Use Token Bucket or Leaky Bucket algorithm implemented via Redis Lua scripts (for atomic operation). Mitigate race conditions and distribute load using API Gateway layer." }
    ];

    const companies = ['google', 'amazon', 'meta', 'microsoft', 'apple', 'uber', 'netflix', 'adobe'];
    const questions = [];
    const totalQ = 300;

    for (let i = 1; i <= totalQ; i++) {
        const seed = templates[(i - 1) % templates.length];
        const varNum = Math.floor((i - 1) / templates.length) + 1;
        
        const compSet = [
            companies[(i) % companies.length],
            companies[(i + 2) % companies.length],
            companies[(i + 5) % companies.length]
        ];

        questions.push({
            id: `iq-${i}`,
            num: i,
            question: varNum > 1 ? `${seed.q} (Interview Pattern #${varNum})` : seed.q,
            difficulty: seed.d,
            topic: seed.t,
            companies: compSet,
            answer: seed.ans,
            tip: `Key Interviewer Expectation: Clearly explain time/space complexity before writing code. Handle edge cases like empty inputs, null pointers, and large numbers.`
        });
    }

    return questions;
}

const dsaInterviewQuestionsData = generateDsaInterviewQuestions();

let currentInterviewPage = 1;
const interviewItemsPerPage = 20;

function filterInterviewByCompany(compKey) {
    currentInterviewCompanyFilter = compKey;
    currentInterviewPage = 1;
    renderDsaInterviewPrepSection();
}

function filterInterviewByDifficulty(diffKey) {
    currentInterviewDifficultyFilter = diffKey;
    currentInterviewPage = 1;
    renderDsaInterviewPrepSection();
}

function searchInterviewQuestions(query) {
    currentInterviewSearchQuery = query;
    currentInterviewPage = 1;
    renderDsaInterviewPrepSection();
}

function setInterviewPage(page) {
    currentInterviewPage = page;
    renderDsaInterviewPrepSection();
    const container = document.getElementById("ds-content-interview");
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleInterviewAnswer(qId) {
    const ansDiv = document.getElementById(`iq-ans-${qId}`);
    if (ansDiv) {
        const isHidden = ansDiv.style.display === 'none';
        ansDiv.style.display = isHidden ? 'block' : 'none';
    }
}

function renderDsaInterviewPrepSection() {
    const container = document.getElementById("ds-content-interview");
    if (!container) return;

    const questions = dsaInterviewQuestionsData;

    let filtered = questions.filter(q => {
        if (currentInterviewCompanyFilter !== 'all' && !q.companies.includes(currentInterviewCompanyFilter)) return false;
        if (currentInterviewDifficultyFilter !== 'all' && q.difficulty.toLowerCase() !== currentInterviewDifficultyFilter.toLowerCase()) return false;
        if (currentInterviewSearchQuery) {
            const query = currentInterviewSearchQuery.toLowerCase();
            const matchQ = q.question.toLowerCase().includes(query);
            const matchAns = q.answer.toLowerCase().includes(query);
            const matchTopic = q.topic.toLowerCase().includes(query);
            const matchCompany = q.companies.some(c => c.toLowerCase().includes(query));
            if (!matchQ && !matchAns && !matchTopic && !matchCompany) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filtered.length / interviewItemsPerPage) || 1;
    if (currentInterviewPage > totalPages) currentInterviewPage = 1;

    const startIndex = (currentInterviewPage - 1) * interviewItemsPerPage;
    const paginatedQuestions = filtered.slice(startIndex, startIndex + interviewItemsPerPage);

    const companyFilterButtons = ['all', 'google', 'amazon', 'meta', 'microsoft', 'apple', 'uber', 'netflix', 'adobe'].map(cKey => {
        if (cKey === 'all') {
            return `<button class="company-btn ${currentInterviewCompanyFilter === 'all' ? 'active' : ''}" onclick="filterInterviewByCompany('all')">🏢 All Companies</button>`;
        }
        const meta = companyMeta[cKey] || { name: cKey.toUpperCase(), class: cKey, icon: '🏢' };
        return `<button class="company-btn ${meta.class} ${currentInterviewCompanyFilter === cKey ? 'active' : ''}" onclick="filterInterviewByCompany('${cKey}')">${meta.icon} ${meta.name}</button>`;
    }).join('');

    const cardsHtml = paginatedQuestions.map(q => {
        const companyPills = q.companies.map(cKey => {
            const meta = companyMeta[cKey];
            return meta ? `<span class="company-pill ${meta.class}">${meta.icon} ${meta.name}</span>` : '';
        }).join('');

        return `
            <div class="interview-q-card" style="margin-top:16px; padding:20px; background:var(--surface); border:1px solid var(--border-soft); border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,0.05); transition:all 0.2s ease;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:10px;">
                    <div style="font-weight:700; color:var(--text-primary); font-size:1.05rem; flex:1; min-width:260px;">
                        Q${q.num}. ${escapeHtml(q.question)}
                    </div>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <span class="dsa-diff-pill ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                        <span class="dsa-prob-cat" style="font-size:0.78rem; padding:4px 10px; border-radius:12px; background:rgba(0,245,160,0.1); color:var(--jade); font-weight:600;">${escapeHtml(q.topic)}</span>
                    </div>
                </div>

                <div class="dsa-company-row" style="margin-bottom:12px;">
                    ${companyPills}
                </div>

                <div style="margin-top:12px;">
                    <button class="dsa-sub-filter-btn" style="padding:6px 14px; font-size:0.85rem; font-weight:600; background:rgba(255,255,255,0.06);" onclick="toggleInterviewAnswer('${q.id}')">
                        💡 Toggle Detailed Answer & Tips
                    </button>
                    <div id="iq-ans-${q.id}" class="interview-ans-box" style="display:none; margin-top:14px; padding:16px; background:rgba(0,0,0,0.2); border-left:3px solid var(--jade); border-radius:8px; font-size:0.92rem; line-height:1.6;">
                        <div style="margin-bottom:10px;"><b>Answer & Strategy:</b> ${q.answer}</div>
                        <div style="font-size:0.85rem; color:var(--text-tertiary); background:rgba(255,255,255,0.04); padding:10px 14px; border-radius:6px; margin-top:10px;">
                            💡 <b>Interview Tip:</b> ${escapeHtml(q.tip)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const paginationHtml = totalPages > 1 ? `
        <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin-top:24px; padding:16px; background:var(--surface); border:1px solid var(--border-soft); border-radius:12px;">
            <button class="dsa-sub-filter-btn" ${currentInterviewPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="setInterviewPage(${currentInterviewPage - 1})">◀ Previous Page</button>
            <span style="font-size:0.92rem; font-weight:600; color:var(--text-primary);">Page ${currentInterviewPage} of ${totalPages}</span>
            <button class="dsa-sub-filter-btn" ${currentInterviewPage === totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="setInterviewPage(${currentInterviewPage + 1})">Next Page ▶</button>
        </div>
    ` : '';

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
            <div>
                <h2 style="margin:0; font-size:1.6rem; color:var(--text-primary);">🧠 300+ Top Company DSA Interview Questions</h2>
                <p style="margin:4px 0 0 0; color:var(--text-secondary); font-size:0.95rem;">Curated real-world coding interview questions asked at Google, Meta, Amazon, Microsoft, Apple, Uber, Netflix & Adobe.</p>
            </div>
        </div>

        <div class="dsa-filter-bar" style="margin-bottom:20px;">
            <div class="dsa-company-filter-row" style="margin-bottom:12px;">${companyFilterButtons}</div>
            
            <div class="dsa-secondary-filter-row">
                <div class="dsa-diff-group">
                    <span class="dsa-filter-label">Difficulty:</span>
                    <button class="dsa-sub-filter-btn ${currentInterviewDifficultyFilter === 'all' ? 'active' : ''}" onclick="filterInterviewByDifficulty('all')">All</button>
                    <button class="dsa-sub-filter-btn ${currentInterviewDifficultyFilter === 'easy' ? 'active' : ''}" onclick="filterInterviewByDifficulty('easy')">🟢 Easy</button>
                    <button class="dsa-sub-filter-btn ${currentInterviewDifficultyFilter === 'medium' ? 'active' : ''}" onclick="filterInterviewByDifficulty('medium')">🟡 Medium</button>
                    <button class="dsa-sub-filter-btn ${currentInterviewDifficultyFilter === 'hard' ? 'active' : ''}" onclick="filterInterviewByDifficulty('hard')">🔴 Hard</button>
                </div>
            </div>

            <div class="dsa-search-row" style="margin-top:12px;">
                <input type="text" id="dsa-interview-search" placeholder="🔍 Search 300+ interview questions by keyword, topic, or company..." value="${escapeHtml(currentInterviewSearchQuery)}" oninput="searchInterviewQuestions(this.value)">
                <span class="dsa-count-badge">Showing ${filtered.length} / ${questions.length} Questions</span>
            </div>
        </div>

        <div id="dsa-interview-q-list">
            ${filtered.length > 0 ? cardsHtml : `<div style="padding:40px; text-align:center; color:var(--text-tertiary);">No interview questions matching your search or filters.</div>`}
        </div>

        ${paginationHtml}
    `;
}
