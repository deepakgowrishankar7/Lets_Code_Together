// ================================================================
//  EDUDASH — QUIZZES.JS
//  Premium quiz renderer with score summary + result cards
// ================================================================

const javaQuizzes = {
  quiz1: [ // Beginner
    { question: "What is the size of an int variable in Java?", options: ["4 bytes", "2 bytes", "8 bytes", "Depends on the system"], answer: "4 bytes" },
    { question: "Which of these is a valid keyword in Java?", options: ["interface", "unsigned", "friend", "sizeof"], answer: "interface" },
    { question: "Which company developed Java?", options: ["Sun Microsystems", "Microsoft", "Apple", "Google"], answer: "Sun Microsystems" },
    { question: "What is the extension of Java bytecode files?", options: [".java", ".class", ".exe", ".jar"], answer: ".class" },
    { question: "Which symbol is used to denote a block of code in Java?", options: ["{}", "()", "[]", "<>"], answer: "{}" },
    { question: "Java is a ___ language.", options: ["Procedural", "Functional", "Object-Oriented", "Scripting"], answer: "Object-Oriented" },
    { question: "Which of the following is a primitive type?", options: ["int", "String", "Integer", "Object"], answer: "int" },
    { question: "Which of these is not a Java feature?", options: ["Object-oriented", "Use of pointers", "Portable", "Dynamic and Extensible"], answer: "Use of pointers" },
    { question: "What is the default value of a boolean variable?", options: ["true", "false", "0", "null"], answer: "false" },
    { question: "What is JVM?", options: ["Java Variable Machine", "Java Virtual Machine", "Java Verified Machine", "None"], answer: "Java Virtual Machine" },
    { question: "What is the output of: System.out.println(1 + 2 + \"3\")?", options: ["33", "123", "6", "33.0"], answer: "33" },
    { question: "Which package contains the Scanner class?", options: ["java.util", "java.io", "java.lang", "java.net"], answer: "java.util" },
    { question: "Which keyword is used to define a class in Java?", options: ["class", "Class", "define", "struct"], answer: "class" },
    { question: "Which method is used to start a thread in Java?", options: ["start()", "run()", "execute()", "init()"], answer: "start()" },
    { question: "Which access modifier makes a member visible to all classes?", options: ["public", "private", "protected", "default"], answer: "public" },
    { question: "Which loop is guaranteed to execute at least once?", options: ["do-while", "while", "for", "foreach"], answer: "do-while" },
    { question: "Which data type is used to store characters?", options: ["char", "String", "Character", "byte"], answer: "char" },
    { question: "Which keyword is used to inherit a class?", options: ["extends", "implements", "inherits", "super"], answer: "extends" },
    { question: "Which exception is thrown when an array is accessed out of bounds?", options: ["ArrayIndexOutOfBoundsException", "IndexOutOfRangeException", "NullPointerException", "IllegalAccessException"], answer: "ArrayIndexOutOfBoundsException" },
    { question: "What is the full form of API?", options: ["Application Programming Interface", "Application Protocol Interface", "Applied Programming Interface", "Advanced Programming Interface"], answer: "Application Programming Interface" }
  ],

  quiz2: [ // Basic
    { question: "Which method is the entry point for a Java program?", options: ["main()", "start()", "run()", "init()"], answer: "main()" },
    { question: "Which keyword is used to prevent inheritance?", options: ["final", "static", "private", "abstract"], answer: "final" },
    { question: "Which operator is used to compare two values?", options: ["==", "=", "!=", "equals"], answer: "==" },
    { question: "Which data type has the largest range?", options: ["long", "int", "double", "float"], answer: "double" },
    { question: "Which keyword is used to handle exceptions?", options: ["try", "catch", "throw", "All of the above"], answer: "All of the above" },
    { question: "Which class is the superclass of all classes?", options: ["Object", "Class", "System", "Main"], answer: "Object" },
    { question: "Which loop is used for definite iteration?", options: ["for", "while", "do-while", "infinite loop"], answer: "for" },
    { question: "What does the break statement do?", options: ["Exits a loop or switch", "Skips one iteration", "Ends method", "Throws error"], answer: "Exits a loop or switch" },
    { question: "What is the size of a char in Java?", options: ["2 bytes", "1 byte", "4 bytes", "Depends"], answer: "2 bytes" },
    { question: "Which keyword is used to create an object?", options: ["new", "class", "this", "super"], answer: "new" },
    { question: "Which keyword refers to the current class object?", options: ["this", "that", "self", "current"], answer: "this" },
    { question: "Which statement is used to import packages?", options: ["import", "include", "package", "require"], answer: "import" },
    { question: "How do you create a constant in Java?", options: ["final", "const", "static", "immutable"], answer: "final" },
    { question: "Which operator is used for logical AND?", options: ["&&", "||", "&", "|"], answer: "&&" },
    { question: "Which block always executes in exception handling?", options: ["finally", "catch", "try", "throw"], answer: "finally" },
    { question: "Which method returns the length of a string?", options: ["length()", "size()", "getLength()", "len()"], answer: "length()" },
    { question: "Which operator is used for string concatenation?", options: ["+", "&", "*", "%"], answer: "+" },
    { question: "What is the default value of int?", options: ["0", "null", "undefined", "NaN"], answer: "0" },
    { question: "What type of language is Java?", options: ["Compiled and Interpreted", "Only Interpreted", "Only Compiled", "None"], answer: "Compiled and Interpreted" },
    { question: "Which method is used to start a thread?", options: ["start()", "run()", "execute()", "begin()"], answer: "start()" }
  ],

  quiz3: [ // Intermediate
    { question: "What is method overloading in Java?", options: ["Using same method name with different parameters", "Using same method name in different classes", "Same method name with same parameters", "Using methods from parent class"], answer: "Using same method name with different parameters" },
    { question: "Which of these is not part of OOP in Java?", options: ["Encapsulation", "Inheritance", "Compilation", "Polymorphism"], answer: "Compilation" },
    { question: "Which class is used to take input from user in Java?", options: ["Scanner", "BufferReader", "InputStream", "Console"], answer: "Scanner" },
    { question: "Which keyword is used to create an abstract class?", options: ["abstract", "interface", "virtual", "extends"], answer: "abstract" },
    { question: "Which collection does not allow duplicates?", options: ["Set", "List", "Map", "ArrayList"], answer: "Set" },
    { question: "What is the purpose of the 'super' keyword?", options: ["Access parent class members", "Refer to current object", "Call static methods", "None"], answer: "Access parent class members" },
    { question: "Which interface is used to sort a collection?", options: ["Comparable", "Comparator", "Sorter", "Orderable"], answer: "Comparable" },
    { question: "What does the 'this' keyword refer to?", options: ["Current class instance", "Superclass", "Static context", "New object"], answer: "Current class instance" },
    { question: "Which exception is unchecked?", options: ["NullPointerException", "IOException", "SQLException", "ClassNotFoundException"], answer: "NullPointerException" },
    { question: "Which stream is used to read characters?", options: ["FileReader", "FileInputStream", "BufferedInputStream", "DataInputStream"], answer: "FileReader" },
    { question: "What is the default capacity of an ArrayList?", options: ["10", "5", "0", "20"], answer: "10" },
    { question: "What is the output of 10/0 in Java?", options: ["ArithmeticException", "Infinity", "0", "NaN"], answer: "ArithmeticException" },
    { question: "Which class is immutable?", options: ["String", "StringBuilder", "StringBuffer", "ArrayList"], answer: "String" },
    { question: "What does JVM stand for?", options: ["Java Virtual Machine", "Java Verified Machine", "Java Variable Module", "None"], answer: "Java Virtual Machine" },
    { question: "Which of these is not a primitive type?", options: ["String", "int", "double", "boolean"], answer: "String" },
    { question: "Which statement is used to exit a loop?", options: ["break", "exit", "return", "continue"], answer: "break" },
    { question: "Which class is used for mutable strings?", options: ["StringBuilder", "String", "StringBuffer", "CharSequence"], answer: "StringBuilder" },
    { question: "What is an interface?", options: ["A contract with method declarations", "A class", "A module", "A library"], answer: "A contract with method declarations" },
    { question: "Which operator is used for bitwise AND?", options: ["&", "&&", "|", "||"], answer: "&" },
    { question: "Which collection allows key-value pairs?", options: ["Map", "Set", "List", "Queue"], answer: "Map" }
  ],

  quiz4: [ // Advanced
    { question: "What is Java Reflection API used for?", options: ["To examine or modify the runtime behavior", "To compile Java code", "To generate bytecode", "To perform garbage collection"], answer: "To examine or modify the runtime behavior" },
    { question: "What is a lambda expression?", options: ["Anonymous function", "A type of interface", "JavaFX expression", "None"], answer: "Anonymous function" },
    { question: "Which functional interface is used in lambda expressions?", options: ["Predicate", "Runnable", "Comparator", "All of the above"], answer: "All of the above" },
    { question: "Which package contains Stream API?", options: ["java.util.stream", "java.io", "java.lang", "java.data"], answer: "java.util.stream" },
    { question: "Which is true for final methods?", options: ["They cannot be overridden", "They cannot be inherited", "They must be static", "They must be private"], answer: "They cannot be overridden" },
    { question: "What does the volatile keyword mean?", options: ["Changes to variable are visible to all threads", "Variable cannot be changed", "Variable is shared across instances", "None"], answer: "Changes to variable are visible to all threads" },
    { question: "What does Optional help with in Java?", options: ["Avoiding NullPointerException", "Enhancing performance", "Serialization", "Reflection"], answer: "Avoiding NullPointerException" },
    { question: "What does the transient keyword do?", options: ["Prevents field from being serialized", "Makes variable static", "Stops garbage collection", "None"], answer: "Prevents field from being serialized" },
    { question: "What is the parent of all exception classes?", options: ["Throwable", "Exception", "RuntimeException", "Object"], answer: "Throwable" },
    { question: "What is try-with-resources used for?", options: ["Auto-close resources", "Manual exception handling", "Performance tuning", "Logging"], answer: "Auto-close resources" },
    { question: "Which of these is a marker interface?", options: ["Serializable", "Comparable", "Runnable", "List"], answer: "Serializable" },
    { question: "What does finalize() method do?", options: ["Called before garbage collection", "Manually deletes object", "Starts the program", "Locks the thread"], answer: "Called before garbage collection" },
    { question: "Which command is used to compile Java code?", options: ["javac", "java", "compile", "jre"], answer: "javac" },
    { question: "What is the difference between == and .equals()?", options: ["== compares references, .equals() compares values", "Both do the same", "== is for values only", ".equals() compares reference only"], answer: "== compares references, .equals() compares values" },
    { question: "Which class is thread-safe for string manipulation?", options: ["StringBuffer", "StringBuilder", "String", "ArrayList"], answer: "StringBuffer" },
    { question: "Which interface provides for-each method in Java 8?", options: ["Iterable", "Collection", "List", "Iterator"], answer: "Iterable" },
    { question: "What is method reference in Java 8?", options: ["Shorthand for lambda", "Variable reference", "Class reference", "None"], answer: "Shorthand for lambda" },
    { question: "What is the base class of all I/O classes?", options: ["InputStream", "Reader", "IOException", "File"], answer: "InputStream" },
    { question: "Which of these is a daemon thread?", options: ["A thread that runs in background", "Thread that runs first", "Main thread", "Thread that never stops"], answer: "A thread that runs in background" },
    { question: "Which exception is thrown when casting fails?", options: ["ClassCastException", "IOException", "NullPointerException", "IllegalStateException"], answer: "ClassCastException" }
  ],

  quiz5: [ // Expert
    { question: "What will happen if wait() is called without synchronized block?", options: ["IllegalMonitorStateException", "Thread waits normally", "Nothing happens", "Thread exits"], answer: "IllegalMonitorStateException" },
    { question: "Which keyword is used to define an enumeration?", options: ["enum", "define", "constant", "fixed"], answer: "enum" },
    { question: "What is the use of CompletableFuture?", options: ["Handle async tasks", "Create new threads", "Cancel futures", "Serialize objects"], answer: "Handle async tasks" },
    { question: "Which data structure provides O(1) lookup?", options: ["HashMap", "ArrayList", "TreeSet", "LinkedList"], answer: "HashMap" },
    { question: "What is the output of: System.out.println(0.0/0);", options: ["NaN", "Infinity", "0", "Error"], answer: "NaN" },
    { question: "What does the synchronized keyword ensure?", options: ["Only one thread accesses a block at a time", "Fast execution", "Better memory", "Garbage collection"], answer: "Only one thread accesses a block at a time" },
    { question: "Which interface supports chaining operations on streams?", options: ["Stream", "List", "Queue", "Iterable"], answer: "Stream" },
    { question: "What is the difference between HashMap and Hashtable?", options: ["Hashtable is synchronized", "HashMap is synchronized", "Hashtable allows nulls", "No difference"], answer: "Hashtable is synchronized" },
    { question: "Which annotation is used for overriding a method?", options: ["@Override", "@Overload", "@Over", "@Method"], answer: "@Override" },
    { question: "What is the purpose of the default method in interface?", options: ["Provide method body", "Force override", "Prevent override", "None"], answer: "Provide method body" },
    { question: "What is the use of ForkJoinPool?", options: ["Parallelism in Java", "Thread sleep", "Forking processes", "Memory cleanup"], answer: "Parallelism in Java" },
    { question: "Which Java version introduced modules?", options: ["Java 9", "Java 8", "Java 7", "Java 6"], answer: "Java 9" },
    { question: "Which class provides thread-safe ArrayList alternative?", options: ["CopyOnWriteArrayList", "Vector", "ConcurrentArray", "SafeList"], answer: "CopyOnWriteArrayList" },
    { question: "Which mechanism is used by JVM to free memory?", options: ["Garbage Collection", "Memory Pooling", "Manual release", "Pointer Deletion"], answer: "Garbage Collection" },
    { question: "Which command runs a compiled Java class?", options: ["java", "javac", "run", "jvm"], answer: "java" },
    { question: "What is the purpose of the strictfp keyword?", options: ["Enforce floating-point precision", "Make function private", "Optimize performance", "None"], answer: "Enforce floating-point precision" },
    { question: "What does the join() method do in threads?", options: ["Waits for thread to die", "Pauses thread", "Starts thread", "Interrupts thread"], answer: "Waits for thread to die" },
    { question: "What is the output of: 'abc'.compareTo('abd')?", options: ["-1", "1", "0", "Exception"], answer: "-1" },
    { question: "Which class is used to manipulate time/date?", options: ["LocalDateTime", "DateUtils", "TimeLib", "Timer"], answer: "LocalDateTime" },
    { question: "What is a deadlock?", options: ["Two threads waiting on each other", "Thread completes normally", "Program crash", "NullPointerException"], answer: "Two threads waiting on each other" }
  ]
};

// -------------------------
// Python quizzes (simplified per-level sets)
// -------------------------
const pythonQuizzes = {
  quiz1: [
    { question: "Which keyword starts a function in Python?", options: ["def", "func", "function", "fn"], answer: "def" },
    { question: "How do you print to the console?", options: ["print()", "echo()", "console.log()", "printf()"], answer: "print()" },
    { question: "Which symbol starts a comment?", options: ["#", "//", "/*", "--"], answer: "#" },
    { question: "How do you create a list?", options: ["[]", "()", "{}", "<>"], answer: "[]" },
    { question: "What is the file extension for Python files?", options: [".py", ".java", ".js", ".txt"], answer: ".py" },
    { question: "How do you import the math module?", options: ["import math", "include math", "require('math')", "using math"], answer: "import math" },
    { question: "Which statement creates a conditional branch?", options: ["if", "switch", "when", "case"], answer: "if" },
    { question: "How do you write a for loop over a list 'a'?", options: ["for x in a:", "for (x in a)", "foreach a as x", "for x:a"], answer: "for x in a:" },
    { question: "How do you get the length of a list?", options: ["len(a)", "size(a)", "a.length", "count(a)"], answer: "len(a)" },
    { question: "Which type is mutable?", options: ["list", "tuple", "str", "int"], answer: "list" }
  ],

  quiz2: [
    { question: "How do you open a file for reading?", options: ["open('f.txt','r')", "open('f.txt','w')", "read('f.txt')", "file('f.txt')"], answer: "open('f.txt','r')" },
    { question: "Which collection is ordered and immutable?", options: ["tuple", "list", "set", "dict"], answer: "tuple" },
    { question: "How do you create a dictionary?", options: ["{}", "[]", "()", "<>"], answer: "{}" },
    { question: "Which keyword raises exceptions?", options: ["raise", "throw", "error", "except"], answer: "raise" },
    { question: "How do you install packages?", options: ["pip install pkg", "apt-get install pkg", "npm install pkg", "pkg install pkg"], answer: "pip install pkg" },
    { question: "Which keyword defines a class?", options: ["class", "struct", "object", "type"], answer: "class" },
    { question: "What does '==' do?", options: ["Equality comparison", "Assignment", "Identity check", "Function call"], answer: "Equality comparison" },
    { question: "Which statement handles exceptions?", options: ["try/except", "try/catch", "catch/except", "handle/except"], answer: "try/except" },
    { question: "Which operator concatenates strings?", options: ["+", "&", ",", "."], answer: "+" },
    { question: "How do you comment multiple lines quickly?", options: ["Use triple quotes" ,"Use //","Use /* */","Use ##"], answer: "Use triple quotes" }
  ],

  quiz3: [
    { question: "What does list comprehension produce?", options: ["A new list", "A generator", "A dict", "A tuple"], answer: "A new list" },
    { question: "What is a generator?", options: ["An iterator defined with yield", "A function returning list", "A class", "A module"], answer: "An iterator defined with yield" },
    { question: "Which method adds an item to a list?", options: ["append()", "add()", "push()", "insert()"], answer: "append()" },
    { question: "How do you open a file using context manager?", options: ["with open('f') as f:", "open('f') as f:", "using open('f'):", "file open('f')"], answer: "with open('f') as f:" },
    { question: "How to handle multiple exceptions?", options: ["except (A, B):", "except A, B:", "catch A B", "except A or B"], answer: "except (A, B):" },
    { question: "What is the result of True and False?", options: ["False", "True", "0", "1"], answer: "False" },
    { question: "Which builtin returns iterator of pairs from two lists?", options: ["zip()", "pair()", "combine()", "join()"], answer: "zip()" },
    { question: "Which module is used for regular expressions?", options: ["re", "regex", "regexp", "pyre"], answer: "re" },
    { question: "How to copy a list shallowly?", options: ["list(a)", "copy.copy(a)", "a[:]", "All of the above"], answer: "All of the above" },
    { question: "Which statement creates an anonymous function?", options: ["lambda", "def", "anon", "func"], answer: "lambda" }
  ],

  quiz4: [
    { question: "Which feature supports concurrency with coroutines?", options: ["async/await", "threads", "multiprocessing", "callbacks"], answer: "async/await" },
    { question: "How to create a virtual environment?", options: ["python -m venv venv", "virtualenv create", "pipenv install", "conda create venv"], answer: "python -m venv venv" },
    { question: "Which module provides JSON support?", options: ["json", "simplejson", "ujson", "All"], answer: "json" },
    { question: "How to run tests with unittest?", options: ["python -m unittest", "pytest", "nosetests", "run tests"], answer: "python -m unittest" },
    { question: "Which decorator preserves function metadata?", options: ["functools.wraps", "preserve", "wraps.decorator", "keep"], answer: "functools.wraps" },
    { question: "What does GIL stand for?", options: ["Global Interpreter Lock", "Global IO Lock", "Generic Interpreter Loop", "Global Instance Lock"], answer: "Global Interpreter Lock" },
    { question: "Which library is common for data analysis?", options: ["pandas", "requests", "flask", "tkinter"], answer: "pandas" },
    { question: "Which method serializes objects to bytes?", options: ["pickle.dumps", "json.dumps", "marshal.dump", "serialize()"], answer: "pickle.dumps" },
    { question: "Which tool formats Python code?", options: ["black", "prettier", "clang-format", "gofmt"], answer: "black" },
    { question: "How do you install a specific package version?", options: ["pip install pkg==1.2.3", "pip install pkg@1.2.3", "pip add pkg:1.2.3", "pip get pkg=1.2.3"], answer: "pip install pkg==1.2.3" }
  ],

  quiz5: [
    { question: "Which pattern helps with resource management?", options: ["context manager", "decorator", "metaclass", "mixin"], answer: "context manager" },
    { question: "What is a metaclass used for?", options: ["Customize class creation", "Manage memory", "Create functions", "None"], answer: "Customize class creation" },
    { question: "Which module helps with type hints?", options: ["typing", "types", "hints", "annotations"], answer: "typing" },
    { question: "Which library is used for async HTTP in modern apps?", options: ["aiohttp", "requests", "urllib", "http.client"], answer: "aiohttp" },
    { question: "How to define an abstract base class?", options: ["abc.ABC", "abstract", "interface", "@abstract"], answer: "abc.ABC" },
    { question: "Which tool helps with dependency management?", options: ["pipenv", "npm", "composer", "bundler"], answer: "pipenv" },
    { question: "Which built-in provides lazy evaluation of ranges?", options: ["range", "xrange", "iter", "generator"], answer: "range" },
    { question: "Which method defines instance representation?", options: ["__repr__", "__str__", "toString", "__format__"], answer: "__repr__" },
    { question: "How to perform multiprocessing?", options: ["multiprocessing.Process", "threading.Thread", "asyncio", "concurrent.futures.ThreadPoolExecutor"], answer: "multiprocessing.Process" },
    { question: "Which tool profiles Python code?", options: ["cProfile", "pyprof", "profiler", "timeit"], answer: "cProfile" }
  ]
};

// -------------------------
// SQL quizzes
// -------------------------
const sqlQuizzes = {
  quiz1: [
    { question: "Which SQL clause selects columns?", options: ["SELECT", "WHERE", "FROM", "JOIN"], answer: "SELECT" },
    { question: "Which clause filters rows?", options: ["WHERE", "GROUP BY", "ORDER BY", "HAVING"], answer: "WHERE" },
    { question: "How do you sort results?", options: ["ORDER BY", "SORT BY", "GROUP BY", "ARRANGE"], answer: "ORDER BY" },
    { question: "Which symbol denotes wildcard in LIKE?", options: ["%", "*", "_", "?"], answer: "%" },
    { question: "Which command removes all rows from a table?", options: ["DELETE", "TRUNCATE", "DROP", "REMOVE"], answer: "DELETE" },
    { question: "How to limit rows in MySQL?", options: ["LIMIT", "TOP", "ROWNUM", "FETCH"], answer: "LIMIT" },
    { question: "Which statement adds rows?", options: ["INSERT INTO", "ADD ROW", "CREATE ROW", "APPEND"], answer: "INSERT INTO" },
    { question: "What does NULL mean?", options: ["Unknown/Missing", "Zero", "Empty string", "False"], answer: "Unknown/Missing" },
    { question: "Which keyword creates a table?", options: ["CREATE TABLE", "NEW TABLE", "MAKE TABLE", "TABLE CREATE"], answer: "CREATE TABLE" },
    { question: "Which clause groups rows for aggregation?", options: ["GROUP BY", "ORDER BY", "HAVING", "PARTITION BY"], answer: "GROUP BY" }
  ],

  quiz2: [
    { question: "Which join returns matching rows only?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"], answer: "INNER JOIN" },
    { question: "Which aggregate counts rows?", options: ["COUNT()", "SUM()", "AVG()", "MAX()"], answer: "COUNT()" },
    { question: "How to add a column to a table?", options: ["ALTER TABLE ADD COLUMN", "UPDATE TABLE ADD", "ADD COLUMN TO", "MODIFY TABLE"], answer: "ALTER TABLE ADD COLUMN" },
    { question: "Which clause filters groups?", options: ["HAVING", "WHERE", "GROUP BY", "ORDER BY"], answer: "HAVING" },
    { question: "Which index speeds up lookups?", options: ["B-tree index", "Hash index", "Full-text index", "All of the above"], answer: "All of the above" },
    { question: "Which type enforces uniqueness?", options: ["UNIQUE", "NOT NULL", "CHECK", "FOREIGN KEY"], answer: "UNIQUE" },
    { question: "Which command removes a table?", options: ["DROP TABLE", "DELETE TABLE", "REMOVE TABLE", "TRUNCATE TABLE"], answer: "DROP TABLE" },
    { question: "Which function returns the maximum?", options: ["MAX()", "HIGH()", "TOP()", "GREATEST()"], answer: "MAX()" },
    { question: "Which clause restricts columns after grouping?", options: ["HAVING", "WHERE", "ORDER BY", "LIMIT"], answer: "HAVING" },
    { question: "Which SQL term describes ensuring referential integrity?", options: ["Foreign Key", "Primary Key", "Index", "Constraint"], answer: "Foreign Key" }
  ],

  quiz3: [
    { question: "What does ACID stand for?", options: ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Index, Data", "Atomic, Consistent, Isolated, Durable", "None"], answer: "Atomicity, Consistency, Isolation, Durability" },
    { question: "Which isolation level may read uncommitted data?", options: ["Read Uncommitted", "Serializable", "Repeatable Read", "Read Committed"], answer: "Read Uncommitted" },
    { question: "Which SQL keyword finds rows in one set but not another?", options: ["EXCEPT", "INTERSECT", "UNION", "JOIN"], answer: "EXCEPT" },
    { question: "Which function returns running total using window functions?", options: ["SUM() OVER()", "SUM() GROUP BY", "ROLLUP", "CUME_DIST()"], answer: "SUM() OVER()" },
    { question: "Which clause defines window partitions?", options: ["PARTITION BY", "GROUP BY", "ORDER BY", "WINDOW"], answer: "PARTITION BY" },
    { question: "What optimizes queries by using precomputed results?", options: ["Materialized view", "View", "Temporary table", "Index"], answer: "Materialized view" },
    { question: "Which operator combines results and removes duplicates?", options: ["UNION", "UNION ALL", "INTERSECT", "EXCEPT"], answer: "UNION" },
    { question: "Which clause limits rows after order?", options: ["LIMIT/OFFSET", "WHERE", "HAVING", "GROUP BY"], answer: "LIMIT/OFFSET" },
    { question: "What is denormalization?", options: ["Adding redundancy to speed reads", "Removing redundancy", "Splitting tables", "Creating indexes"], answer: "Adding redundancy to speed reads" },
    { question: "Which tool shows query execution plan?", options: ["EXPLAIN", "PLAN", "DESCRIBE", "SHOW PLAN"], answer: "EXPLAIN" }
  ],

  quiz4: [
    { question: "Which statement starts a transaction in PostgreSQL?", options: ["BEGIN", "START", "BEGIN TRANSACTION", "TX_BEGIN"], answer: "BEGIN" },
    { question: "Which command creates a stored procedure?", options: ["CREATE PROCEDURE", "CREATE FUNCTION", "CREATE PROC", "CREATE ROUTINE"], answer: "CREATE PROCEDURE" },
    { question: "Which isolation level is the strictest?", options: ["Serializable", "Repeatable Read", "Read Committed", "Read Uncommitted"], answer: "Serializable" },
    { question: "What does VACUUM do in Postgres?", options: ["Reclaim storage and analyze tables", "Remove rows", "Backup database", "Update indexes"], answer: "Reclaim storage and analyze tables" },
    { question: "Which index type is good for range scans?", options: ["B-tree", "Hash", "GIN", "GiST"], answer: "B-tree" },
    { question: "Which clause is used for conditional aggregation?", options: ["CASE WHEN", "IF", "COND", "SWITCH"], answer: "CASE WHEN" },
    { question: "Which feature helps with full-text search?", options: ["FTS / tsvector", "LIKE", "REGEXP", "ILIKE"], answer: "FTS / tsvector" },
    { question: "Which command creates an index concurrently in Postgres?", options: ["CREATE INDEX CONCURRENTLY", "CREATE INDEX", "CREATE INDEX PARALLEL", "CREATE INDEX NOWAIT"], answer: "CREATE INDEX CONCURRENTLY" },
    { question: "Which SQL extension supports JSON operators in Postgres?", options: ["jsonb", "json", "xml", "text"], answer: "jsonb" },
    { question: "Which tool helps migrate schema changes?", options: ["Liquibase / Flyway", "pg_dump", "psql", "pgAdmin"], answer: "Liquibase / Flyway" }
  ],

  quiz5: [
    { question: "What is sharding?", options: ["Partitioning data across servers", "Creating indexes", "Normalizing tables", "Archiving data"], answer: "Partitioning data across servers" },
    { question: "Which approach helps with high availability?", options: ["Replication", "Indexing", "Normalization", "Transactions"], answer: "Replication" },
    { question: "Which SQL pattern helps with slowly changing dimensions?", options: ["Type 1/2/3 SCD", "OLAP", "ETL", "Normalization"], answer: "Type 1/2/3 SCD" },
    { question: "Which storage engine supports transactions in MySQL?", options: ["InnoDB", "MyISAM", "CSV", "Memory"], answer: "InnoDB" },
    { question: "Which metric measures query performance?", options: ["Latency and throughput", "CPU only", "Disk only", "Cache hit rate only"], answer: "Latency and throughput" },
    { question: "Which join algorithm is common in RDBMS?", options: ["Hash join", "Nested loop", "Sort-merge", "All of the above"], answer: "All of the above" },
    { question: "What is eventual consistency?", options: ["Updates propagate eventually across replicas", "Immediate strong consistency", "No consistency guarantees", "Single node consistency"], answer: "Updates propagate eventually across replicas" },
    { question: "Which technique improves write throughput?", options: ["Batched writes", "Single row inserts", "Synchronous commits", "Disable indexes"], answer: "Batched writes" },
    { question: "Which data warehouse pattern stores pre-aggregated facts?", options: ["Star schema", "Normalized OLTP schema", "Key-value store", "Document store"], answer: "Star schema" },
    { question: "Which command helps analyze index usage?", options: ["EXPLAIN ANALYZE", "ANALYZE INDEX", "SHOW INDEX USAGE", "DESCRIBE INDEX"], answer: "EXPLAIN ANALYZE" }
  ]
};

// ================================================================
//  HELPERS
// ================================================================
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getScoreColor(pct) {
  if (pct >= 80) return '#22c55e';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

function getScoreEmoji(pct) {
  if (pct === 100) return '🏆';
  if (pct >= 80)  return '🎯';
  if (pct >= 60)  return '👍';
  if (pct >= 40)  return '📚';
  return '💪';
}

function getQuizTitle(level) {
  const titles = {
    quiz1: 'Java Beginner',
    quiz2: 'Java Basic',
    quiz3: 'Java Intermediate',
    quiz4: 'Java Advanced',
    quiz5: 'Java Expert'
  };
  return titles[level] || 'Java Quiz';
}

// ================================================================
//  RENDER QUIZ (question form)
// ================================================================
function renderQuiz(level, course = 'java') {
  return renderCourseQuiz(course, level);
}

// ================================================================
//  SUBMIT & RENDER RESULTS
// ================================================================


// ================================================================
//  BUTTON LISTENERS (attach after DOM ready)
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Java buttons
  document.getElementById('quiz1Btn')?.addEventListener('click', () => renderQuiz('quiz1'));
  document.getElementById('quiz2Btn')?.addEventListener('click', () => renderQuiz('quiz2'));
  document.getElementById('quiz3Btn')?.addEventListener('click', () => renderQuiz('quiz3'));
  document.getElementById('quiz4Btn')?.addEventListener('click', () => renderQuiz('quiz4'));
  document.getElementById('quiz5Btn')?.addEventListener('click', () => renderQuiz('quiz5'));

  // Python buttons
  document.getElementById('pythonQuiz1Btn')?.addEventListener('click', () => renderCourseQuiz('python', 'quiz1'));
  document.getElementById('pythonQuiz2Btn')?.addEventListener('click', () => renderCourseQuiz('python', 'quiz2'));
  document.getElementById('pythonQuiz3Btn')?.addEventListener('click', () => renderCourseQuiz('python', 'quiz3'));
  document.getElementById('pythonQuiz4Btn')?.addEventListener('click', () => renderCourseQuiz('python', 'quiz4'));
  document.getElementById('pythonQuiz5Btn')?.addEventListener('click', () => renderCourseQuiz('python', 'quiz5'));

  // SQL buttons
  document.getElementById('sqlQuiz1Btn')?.addEventListener('click', () => renderCourseQuiz('sql', 'quiz1'));
  document.getElementById('sqlQuiz2Btn')?.addEventListener('click', () => renderCourseQuiz('sql', 'quiz2'));
  document.getElementById('sqlQuiz3Btn')?.addEventListener('click', () => renderCourseQuiz('sql', 'quiz3'));
  document.getElementById('sqlQuiz4Btn')?.addEventListener('click', () => renderCourseQuiz('sql', 'quiz4'));
  document.getElementById('sqlQuiz5Btn')?.addEventListener('click', () => renderCourseQuiz('sql', 'quiz5'));
});

// -------------------------------
// Course-agnostic renderer for Python and SQL
// -------------------------------
const quizzesMap = { java: javaQuizzes, python: pythonQuizzes, sql: sqlQuizzes };

function getCourseQuizTitle(course, level) {
  const base = {
    quiz1: 'Beginner', quiz2: 'Basic', quiz3: 'Intermediate', quiz4: 'Advanced', quiz5: 'Expert'
  };
  const courseName = course.charAt(0).toUpperCase() + course.slice(1);
  return `${courseName} ${base[level] || 'Quiz'}`;
}

function renderCourseQuiz(course, level) {
  const containerMap = { java: 'quizContainer', python: 'pythonQuizContainer', sql: 'sqlQuizContainer' };
  const containerId = containerMap[course] || `${course}QuizContainer`;
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  // Update active button state for this course only
  const buttonsToClear = document.querySelectorAll(`.quiz-level-buttons[data-course="${course}"] button, #${course}-content-quiz .quiz-level-buttons button`);
  buttonsToClear.forEach(btn => btn.classList.remove('active'));
  const btnMap = {
    java: { quiz1: 'quiz1Btn', quiz2: 'quiz2Btn', quiz3: 'quiz3Btn', quiz4: 'quiz4Btn', quiz5: 'quiz5Btn' },
    python: { quiz1: 'pythonQuiz1Btn', quiz2: 'pythonQuiz2Btn', quiz3: 'pythonQuiz3Btn', quiz4: 'pythonQuiz4Btn', quiz5: 'pythonQuiz5Btn' },
    sql: { quiz1: 'sqlQuiz1Btn', quiz2: 'sqlQuiz2Btn', quiz3: 'sqlQuiz3Btn', quiz4: 'sqlQuiz4Btn', quiz5: 'sqlQuiz5Btn' }
  };
  const activeBtnId = btnMap[course] ? btnMap[course][level] : null;
  if (activeBtnId) document.getElementById(activeBtnId)?.classList.add('active');

  const quizSet = quizzesMap[course];
  if (!quizSet || !quizSet[level]) { container.innerHTML = '<p>Quiz not found!</p>'; return; }

  const quiz = shuffleArray([...quizSet[level]]);
  const form = document.createElement('form');
  form.id = `${course}QuizForm`;

  quiz.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-question';

    const qHeader = document.createElement('div');
    qHeader.style.cssText = 'display:flex; align-items:flex-start; gap:12px; margin-bottom:14px;';

    const qNum = document.createElement('span');
    qNum.style.cssText = `
      min-width:28px; height:28px; border-radius:8px;
      background:var(--elevated); color:var(--text-secondary);
      font-size:0.75rem; font-weight:700;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0; margin-top:1px;
    `;
    qNum.textContent = idx + 1;

    const qText = document.createElement('p');
    qText.style.cssText = 'font-weight:700; color:var(--text-primary); margin:0; line-height:1.45;';
    qText.textContent = q.question;

    qHeader.appendChild(qNum);
    qHeader.appendChild(qText);
    card.appendChild(qHeader);

    const optionsWrap = document.createElement('div');
    optionsWrap.style.cssText = 'display:flex; flex-direction:column; gap:6px; margin-left:40px;';

    q.options.forEach(option => {
      const label = document.createElement('label');
      label.style.cssText = `
        display:flex; align-items:center; gap:10px;
        padding:9px 14px; border-radius:8px; cursor:pointer;
        border:1px solid transparent; font-size:0.88rem;
        color:var(--text-secondary);
        transition: all 0.15s;
      `;

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${idx}`;
      input.value = option;
      input.style.cssText = 'accent-color: var(--jade); width:15px; height:15px; flex-shrink:0;';

      label.addEventListener('mouseenter', () => {
        label.style.background = 'var(--jade-trace)';
        label.style.borderColor = 'var(--border-medium)';
        label.style.color = 'var(--text-primary)';
      });
      label.addEventListener('mouseleave', () => {
        if (!input.checked) {
          label.style.background = '';
          label.style.borderColor = 'transparent';
          label.style.color = 'var(--text-secondary)';
        }
      });
      input.addEventListener('change', () => {
        optionsWrap.querySelectorAll('label').forEach(l => {
          l.style.background = '';
          l.style.borderColor = 'transparent';
          l.style.color = 'var(--text-secondary)';
        });
        label.style.background = 'var(--jade-pulse)';
        label.style.borderColor = 'var(--border-medium)';
        label.style.color = 'var(--text-primary)';
      });

      label.appendChild(input);
      label.appendChild(document.createTextNode(option));
      optionsWrap.appendChild(label);
    });

    card.appendChild(optionsWrap);
    form.appendChild(card);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.textContent = '✔ Submit Quiz';
  submitBtn.style.cssText = `
    margin-top:24px; padding:13px 32px; border-radius:10px; border:none;
    background:var(--jade); color:var(--void);
    font-size:0.95rem; font-weight:700; cursor:pointer;
    box-shadow: 0 4px 18px var(--jade-glow);
    transition: all 0.2s;
  `;
  submitBtn.onmouseover = () => { submitBtn.style.transform = 'translateY(-2px)'; submitBtn.style.boxShadow = '0 8px 28px var(--jade-glow)'; };
  submitBtn.onmouseleave = () => { submitBtn.style.transform = ''; };
  submitBtn.onclick = () => submitCourseQuiz(course, quiz, form, level, container);

  form.appendChild(submitBtn);
  container.appendChild(form);
}

function submitCourseQuiz(course, quiz, form, level, container) {
  let correct = 0, wrong = 0, skipped = 0;
  const results = [];

  quiz.forEach((q, idx) => {
    const selected = form[`q${idx}`] ? form[`q${idx}`].value : '';
    const isSkipped = !selected;
    const isCorrect = !isSkipped && selected === q.answer;

    if (isCorrect)       correct++;
    else if (isSkipped)  skipped++;
    else                 wrong++;

    results.push({ question: q.question, selected, correct: q.answer, isCorrect, isSkipped });
  });

  const total = quiz.length;
  const pct   = Math.round((correct / total) * 100);
  const color = getScoreColor(pct);
  const emoji = getScoreEmoji(pct);

  container.innerHTML = '';

  const summary = document.createElement('div');
  summary.className = 'quiz-score-summary';
  summary.innerHTML = `
    <div class="quiz-summary-content" style="flex:1">
      <div class="score-title">${emoji} ${getCourseQuizTitle(course, level)} — Completed!</div>
      <div style="margin-top:12px;" class="quiz-score-stats">
        <div class="quiz-stat stat-correct">
          <span class="quiz-stat-value">${correct}</span>
          <span class="quiz-stat-label">Correct</span>
        </div>
        <div class="quiz-stat stat-wrong">
          <span class="quiz-stat-value">${wrong}</span>
          <span class="quiz-stat-label">Wrong</span>
        </div>
        <div class="quiz-stat stat-skipped">
          <span class="quiz-stat-value">${skipped}</span>
          <span class="quiz-stat-label">Skipped</span>
        </div>
        <div class="quiz-stat">
          <span class="quiz-stat-value" style="color:var(--text-secondary)">${total}</span>
          <span class="quiz-stat-label">Total</span>
        </div>
      </div>
    </div>
    <div class="quiz-score-circle" style="border-color:${color}; color:${color}; box-shadow: 0 0 24px ${color}33;">
      ${pct}%<span>Score</span>
    </div>
  `;
  const currentCourseTitle = getCourseQuizTitle(course, level);
  const learnerName = localStorage.getItem('loggedInUserName') || localStorage.getItem('loggedInEmail') || 'Valued Learner';

  if (pct >= 40) {
    const certBtn = document.createElement('button');
    certBtn.className = 'quiz-retry-btn';
    certBtn.style.cssText = 'background:linear-gradient(135deg, #22c55e, #16a34a); color:#021a0d; font-weight:700; margin-top:16px; width:100%; border:none; box-shadow: 0 4px 15px rgba(34,197,94,0.3); cursor:pointer; padding:12px 20px; border-radius:8px; display:block;';
    certBtn.innerHTML = '🎓 Download Official Completion Certificate';
    certBtn.onclick = () => downloadQuizCertificate(learnerName, currentCourseTitle, correct, total);
    summary.querySelector('.quiz-summary-content').appendChild(certBtn);
  } else {
    const notice = document.createElement('div');
    notice.style.cssText = 'color:#eab308; margin-top:12px; font-size:0.9em; font-weight:600;';
    notice.innerHTML = '💡 Score 40% or higher to unlock your Official Completion Certificate!';
    summary.querySelector('.quiz-summary-content').appendChild(notice);
  }

  container.appendChild(summary);

  const heading = document.createElement('div');
  heading.className = 'quiz-results-heading';
  heading.innerHTML = '📋 Detailed Results';
  container.appendChild(heading);

  results.forEach((res, i) => {
    const card = document.createElement('div');
    let cardClass = 'quiz-result-card ';
    if (res.isSkipped)      cardClass += 'skipped';
    else if (res.isCorrect) cardClass += 'correct';
    else                    cardClass += 'wrong';
    card.className = cardClass;

    const qRow = document.createElement('div');
    qRow.className = 'quiz-result-question';

    const qNum = document.createElement('div');
    qNum.className = 'quiz-result-qnum';
    qNum.textContent = `Q${i + 1}`;

    const qText = document.createElement('div');
    qText.className = 'quiz-result-qtext';
    qText.textContent = res.question;

    qRow.appendChild(qNum);
    qRow.appendChild(qText);
    card.appendChild(qRow);

    const answersWrap = document.createElement('div');
    answersWrap.className = 'quiz-result-answers';

    if (res.isSkipped) {
      answersWrap.innerHTML = `
        <div class="quiz-answer-row skipped-answer">
          <span class="quiz-answer-icon">⏭</span>
          <span class="quiz-answer-label">Not Answered</span>
          <span>You skipped this question</span>
        </div>
        <div class="quiz-answer-row correct-answer">
          <span class="quiz-answer-icon">✓</span>
          <span class="quiz-answer-label">Correct Answer</span>
          <span>${res.correct}</span>
        </div>
      `;
    } else if (res.isCorrect) {
      answersWrap.innerHTML = `
        <div class="quiz-answer-row user-answer user-correct">
          <span class="quiz-answer-icon">✓</span>
          <span class="quiz-answer-label">Your Answer</span>
          <span>${res.selected}</span>
        </div>
      `;
    } else {
      answersWrap.innerHTML = `
        <div class="quiz-answer-row user-answer">
          <span class="quiz-answer-icon">✗</span>
          <span class="quiz-answer-label">Your Answer</span>
          <span>${res.selected}</span>
        </div>
        <div class="quiz-answer-row correct-answer">
          <span class="quiz-answer-icon">✓</span>
          <span class="quiz-answer-label">Correct Answer</span>
          <span>${res.correct}</span>
        </div>
      `;
    }

    card.appendChild(answersWrap);
    container.appendChild(card);
  });

  const retryBtn = document.createElement('button');
  retryBtn.className = 'quiz-retry-btn';
  retryBtn.innerHTML = '↺ Try Again';
  retryBtn.onclick = () => renderCourseQuiz(course, level);
  container.appendChild(retryBtn);

  const email = localStorage.getItem('loggedInEmail') || 'guest@example.com';
  fetch('/api/save-quiz-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, quiz: currentCourseTitle, score: correct, total })
  })
  .then(res => res.json())
  .then(data => console.log('✅ Quiz saved:', data))
  .catch(err => console.error('❌ Error saving quiz:', err));

  summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ================================================================
   PROFESSIONAL HACKERRANK-STYLE CERTIFICATE GENERATOR
================================================================ */
function downloadQuizCertificate(userName, courseTitle, score, total) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1130;
  const ctx = canvas.getContext('2d');

  // 1. Pure White Clean Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1600, 1130);

  // 2. Security Guilloche Pattern Border Frame
  const borderPadding = 40;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(borderPadding, borderPadding, 1600 - (borderPadding * 2), 1130 - (borderPadding * 2));

  // Inner Double Border Lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, 1490, 1020);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(65, 65, 1470, 1000);

  // Corner Accent Circles
  const corners = [[65, 65], [1535, 65], [65, 1065], [1535, 1065]];
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
    ctx.stroke();
  });

  // 3. Top Dark Brand Badge
  const centerX = 800;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(centerX, 150, 52, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, 150, 46, 0, 2 * Math.PI);
  ctx.stroke();

  // Code Icon inside Badge
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 32px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('</>', centerX, 151);

  // 4. Main Certificate Title
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 58px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Certificate of Accomplishment', centerX, 290);

  // 5. Dark Ribbon Banner with Diamond Pointed Ends
  const cleanTitle = (courseTitle || 'Skill Assessment').replace(/Assessment$/i, '').trim();
  ctx.font = 'bold 26px sans-serif';
  const textWidth = ctx.measureText(cleanTitle).width;
  const bannerWidth = Math.max(340, textWidth + 100);
  const bannerHeight = 58;
  const bannerY = 345;
  const bannerLeft = centerX - (bannerWidth / 2);
  const diamondWidth = 28;

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(bannerLeft, bannerY);
  ctx.lineTo(bannerLeft + bannerWidth, bannerY);
  ctx.lineTo(bannerLeft + bannerWidth + diamondWidth, bannerY + (bannerHeight / 2));
  ctx.lineTo(bannerLeft + bannerWidth, bannerY + bannerHeight);
  ctx.lineTo(bannerLeft, bannerY + bannerHeight);
  ctx.lineTo(bannerLeft - diamondWidth, bannerY + (bannerHeight / 2));
  ctx.closePath();
  ctx.fill();

  // Course Name inside Ribbon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(cleanTitle, centerX, bannerY + 38);

  // 6. Subtext: "PRESENTED TO"
  ctx.fillStyle = '#64748b';
  ctx.font = '600 18px sans-serif';
  ctx.fillText('PRESENTED TO', centerX, 490);

  // 7. Student Name in Elegant Calligraphic Serif Font
  const rawName = userName && !userName.includes('@') ? userName : 'Valued Learner';
  const formattedName = rawName.toUpperCase();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'italic 50px Georgia, "Times New Roman", serif';
  ctx.fillText(formattedName, centerX, 580);

  // Underline Accent
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 300, 610);
  ctx.lineTo(centerX + 300, 610);
  ctx.stroke();

  // 8. Body Verification Text
  ctx.fillStyle = '#475569';
  ctx.font = '22px sans-serif';
  ctx.fillText('The bearer of this certificate has passed the Let\'s Code Together skill certification test', centerX, 680);

  // 9. Footer Details & Verification Signature
  const footerY = 910;
  const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  const todayStr = new Date().toLocaleDateString('en-GB', dateOptions);
  const certId = 'C' + Math.floor(100000000000 + Math.random() * 900000000000).toString(16).toUpperCase();

  // Left Footer: Date & ID
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Earned on: ${todayStr}`, 160, footerY);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px monospace';
  ctx.fillText(`ID: ${certId}`, 160, footerY + 30);

  // Right Footer: Cursive Signature & Official Designation
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'italic bold 36px "Dancing Script", "Brush Script MT", "Great Vibes", cursive, serif';
  ctx.fillText('Deepak Gowri Shankar', 1440, footerY - 10);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(1180, footerY + 5);
  ctx.lineTo(1440, footerY + 5);
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Deepak Gowri Shankar', 1440, footerY + 30);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px sans-serif';
  ctx.fillText('Founder & CEO, Let\'s Code Together', 1440, footerY + 55);

  // 10. Auto-download PNG image
  const a = document.createElement('a');
  a.download = `Certificate_${cleanTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

/* ================================================================
   QUIZ ANTI-CHEATING PROTECTION (DISABLE COPY, CUT, RIGHT-CLICK & SCREENSHOTS)
   ================================================================ */
function isQuizCurrentlyActive() {
    const activeQuizBlock = document.querySelector(".quiz-question, .quiz-card, .quiz-container, #quizContainer, #pythonQuizContainer, #sqlQuizContainer");
    if (!activeQuizBlock) return false;
    return (activeQuizBlock.offsetWidth > 0 || activeQuizBlock.offsetHeight > 0) && getComputedStyle(activeQuizBlock).display !== 'none';
}

function initQuizAntiCheating() {
    const quizSelector = ".quiz-question, #quizContainer, #pythonQuizContainer, #sqlQuizContainer, .quiz-card, .quiz-container";

    document.addEventListener("selectionchange", () => {
        if (!isQuizCurrentlyActive()) return;
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
            if (sel.anchorNode) {
                const node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
                if (node && typeof node.closest === 'function' && node.closest(quizSelector)) {
                    sel.removeAllRanges();
                }
            }
        }
    });

    // Block selectstart
    window.addEventListener("selectstart", (e) => {
        if (isQuizCurrentlyActive() && e.target && typeof e.target.closest === 'function' && e.target.closest(quizSelector)) {
            e.preventDefault();
            return false;
        }
    }, true);

    // Block Right Click (Context Menu)
    window.addEventListener("contextmenu", (e) => {
        if (isQuizCurrentlyActive() && e.target && typeof e.target.closest === 'function' && e.target.closest(quizSelector)) {
            e.preventDefault();
            if (window.getSelection) window.getSelection().removeAllRanges();
            return false;
        }
    }, true);

    // Block Copy and Cut operations
    window.addEventListener("copy", (e) => {
        if (isQuizCurrentlyActive() && e.target && typeof e.target.closest === 'function' && e.target.closest(quizSelector)) {
            e.preventDefault();
            if (e.clipboardData) e.clipboardData.setData("text/plain", "");
            if (window.getSelection) window.getSelection().removeAllRanges();
            alert("⚠️ Copying text is disabled during Quizzes!");
            return false;
        }
    }, true);

    window.addEventListener("cut", (e) => {
        if (isQuizCurrentlyActive() && e.target && typeof e.target.closest === 'function' && e.target.closest(quizSelector)) {
            e.preventDefault();
            return false;
        }
    }, true);

    // Block Shortcuts (Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+P, PrintScreen, Win+Shift+S)
    window.addEventListener("keydown", (e) => {
        if (isQuizCurrentlyActive()) {
            const isCtrl = e.ctrlKey || e.metaKey;
            
            if (isCtrl && ["c", "u", "s", "p", "a"].includes(e.key.toLowerCase())) {
                e.preventDefault();
                if (window.getSelection) window.getSelection().removeAllRanges();
                alert("⚠️ Copying and selecting are disabled during Quizzes!");
                return false;
            }

            // Block PrintScreen & Snipping Tool
            if (e.key === "PrintScreen" || e.keyCode === 44 || (isCtrl && e.shiftKey && e.key.toLowerCase() === "s")) {
                e.preventDefault();
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(""); // Clear clipboard
                }
                alert("⚠️ Screenshots and Snipping Tool are disabled during Quizzes!");
                return false;
            }
        }
    }, true);

    // Auto-blur quiz content when window loses focus (Snipping tool / Alt+Tab / Tab switch)
    window.addEventListener("blur", () => {
        if (isQuizCurrentlyActive()) {
            const activeQuiz = document.querySelector("#quizContainer, #pythonQuizContainer, #sqlQuizContainer, #java-content-quiz, #python-content-quiz, #sql-content-quiz");
            if (activeQuiz) {
                activeQuiz.classList.add("quiz-blur-protection");
            }
        }
    });

    window.addEventListener("focus", () => {
        const activeQuiz = document.querySelector("#quizContainer, #pythonQuizContainer, #sqlQuizContainer, #java-content-quiz, #python-content-quiz, #sql-content-quiz");
        if (activeQuiz) {
            activeQuiz.classList.remove("quiz-blur-protection");
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (isQuizCurrentlyActive()) {
            const activeQuiz = document.querySelector("#quizContainer, #pythonQuizContainer, #sqlQuizContainer, #java-content-quiz, #python-content-quiz, #sql-content-quiz");
            if (activeQuiz) {
                if (document.hidden) {
                    activeQuiz.classList.add("quiz-blur-protection");
                } else {
                    activeQuiz.classList.remove("quiz-blur-protection");
                }
            }
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuizAntiCheating);
} else {
    initQuizAntiCheating();
}


