// tom-weatherhead/thaw-parser/test/scheme.test.ts

'use strict';

import { createTokenizer, LexicalAnalyzerSelector } from 'thaw-lexical-analyzer';

import {
	createGrammar,
	IExpression,
	ISExpression,
	LanguageSelector,
	SchemeGlobalInfo
} from 'thaw-grammar';

import { createParser, ParserSelector, SyntaxException } from '..';

test('LL(1) Scheme parser instance creation test', () => {
	// Arrange
	const ls = LanguageSelector.Scheme;
	const grammar = createGrammar(ls);

	// Act
	const parser = createParser(ParserSelector.LL1, grammar);

	// Assert
	expect(parser).toBeTruthy();
});

test('LL(1) Scheme recognize test', () => {
	// 	// Arrange
	const ls = LanguageSelector.Scheme;
	// const prologGlobalInfo = new PrologGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	const f = (str: string): void => parser.recognize(tokenizer.tokenize(str));

	f('(* 7 13)');

	f('+');
	f('(lambda (x) (+ x 1))');
	f('(primop? +)');
	f('(closure? (lambda (x) (+ x 1)))');

	expect(() => f('(* 7 13')).toThrow(SyntaxException);
});

function schemeTest(data: Array<[input: string, expectedResult: string | string[]]>): void {
	// Arrange
	const ls = LanguageSelector.Scheme;
	const schemeGlobalInfo = new SchemeGlobalInfo();
	const grammar = createGrammar(ls);
	const tokenizer = createTokenizer(LexicalAnalyzerSelector.MidnightHack, ls);
	const parser = createParser(ParserSelector.LL1, grammar);

	for (const [input, expectedResult] of data) {
		// Act
		const parseResult = parser.parse(tokenizer.tokenize(input));
		const expr = parseResult as IExpression<ISExpression>;
		const actualResult = expr
			.evaluate(schemeGlobalInfo.globalEnvironment, schemeGlobalInfo)
			.toString();

		// console.log(`input: ${input}\nactualResult:\n${actualResult}\n\n`);

		// Assert
		if (typeof expectedResult === 'string') {
			expect(actualResult).toBe(expectedResult);
		} else {
			for (const str of expectedResult) {
				expect(actualResult.includes(str)).toBe(true);
			}
		}
	}
}

// [Test]
// public void PrimOpTest1()
// {
//     var input = "+";
//     var parseResult = GetParseResult(input);
//
//     Assert.IsNotNull(parseResult);
//     Assert.AreEqual("PrimOp", parseResult.GetType().Name);
//
//     var sexpr = EvaluateToISExpression(input);
//
//     Assert.IsTrue(sexpr.IsPrimOp());
//     Assert.IsTrue(sexpr is PrimOp);
//
//     var primOp = sexpr as PrimOp;
//
//     Assert.AreEqual(input, primOp.OperatorName.Value);
// }

test('LL(1) Scheme addition test 1', () => {
	schemeTest([['(+ 2 3)', '5']]);
});

test('LL(1) Scheme PrimOpTest2', () => {
	schemeTest([
		['(set add +)', '+'],
		['(add 2 3)', '5']
	]);
});

// [Test]
// public void ClosureTest1()
// {
//     var input = "(lambda (x) (+ x 1))";
//     var sexpr = EvaluateToISExpression(input);
//
//     Assert.IsTrue(sexpr.IsClosure());
//     Assert.IsTrue(sexpr is Closure);
// }

test('LL(1) Scheme ClosureTest2', () => {
	schemeTest([
		['(set increment (lambda (x) (+ x 1)))', '<closure>'],
		['(increment 13)', '14']
	]);
});

test('LL(1) Scheme ClosureTest3', () => {
	schemeTest([
		['(set add (lambda (x) (lambda (y) (+ x y))))', '<closure>'],
		['((add 8) 13)', '21']
	]);
});

test('LL(1) Scheme let test', () => {
	schemeTest([['(let ((m (* 3 4)) (n (+ 2 3))) (list m n))', '(12 5)']]);
});

test('LL(1) Scheme let* test', () => {
	schemeTest([['(let* ((x (+ 2 3)) (y (* x x))) y)', '25']]);
});

// [Test]
// public void LetStarNonRecursiveTest()    // 2014/02/17 : Derived from Kamin page 126.
// {
//     // Assert that let* is not a clone of letrec.
//     Assert.Throws<EvaluationException>(() => Evaluate(@"
// (let*
// ((countones (lambda (l)
// (if (null? l) 0
//     (if (= (car l) 1) (+ 1 (countones (cdr l)))
//         (countones (cdr l)))))))
// (countones '(1 2 3 1 0 1 1 5)))"));
// }

test('LL(1) Scheme letrec test', () => {
	schemeTest([
		[
			'(letrec ' +
				'((countones (lambda (l) ' +
				'(if (null? l) 0 ' +
				'(if (= (car l) 1) (+ 1 (countones (cdr l))) ' +
				'(countones (cdr l))))))) ' +
				"(countones '(1 2 3 1 0 1 1 5)))",
			'4'
		]
	]);
});

test('LL(1) Scheme cond test', () => {
	schemeTest([
		[
			"(set condtest (lambda (n) (cond ((= n 1) 'First) ((= n 2) 'Second) ((= n 3) 'Third) ('T 'Other))))",
			'<closure>'
		],
		['(condtest 0)', 'Other'],
		['(condtest 1)', 'First'],
		['(condtest 2)', 'Second'],
		['(condtest 3)', 'Third'],
		['(condtest 4)', 'Other']
	]);
});

test('LL(1) Scheme call/cc test', () => {
	// From Kamin page 128.
	schemeTest([
		['(set mod (lambda (m n) (- m (* n (/ m n)))))', '<closure>'],
		['(set gcd (lambda (m n) (if (= n 0) m (gcd n (mod m n)))))', '<closure>'],
		[
			'(set gcd* (lambda (l) ' +
				'(call/cc (lambda (exit) ' +
				'(letrec ((gcd*-aux (lambda (l) ' +
				'    (if (= (car l) 1) (exit 1) ' +
				'        (if (null? (cdr l)) (car l) ' +
				'            (gcd (car l) (gcd*-aux (cdr l)))))))) ' +
				'    (gcd*-aux l))))))',
			'<closure>'
		],
		["(gcd* '(9 27 81 60))", '3'],
		["(gcd* '(101 202 103))", '1'],
		["(gcd* '(9 27 1 81 60))", '1'],
		["(gcd* '(9 27 81 60 1 NotANumber))", '1']
	]);
});

test('LL(1) Scheme list test', () => {
	schemeTest([
		['(list)', '()'],
		['(list 1)', '(1)'],
		['(list 1 2 3)', '(1 2 3)'],
		["(list 1 + 'T)", '(1 + T)']
	]);
});

test('LL(1) Scheme static scope test', () => {
	// See page 135 of Kamin, or pages 128-137 for more context about static vs. dynamic scope.
	schemeTest([
		['(set add (lambda (x) (lambda (y) (+ x y))))', '<closure>'],
		['(set add1 (add 1))', '<closure>'],
		['(set f (lambda (x) (add1 x)))', '<closure>'],
		// Assert that our Scheme uses static scope, as Scheme should.
		['(f 5)', '6']
	]);
});

test('LL(1) Scheme Global vs. Local Variable test', () => {
	schemeTest([
		['(set a 1)', '1'],
		['(set afunc (lambda () a))', '<closure>'],
		['(set func2 (lambda (a) (afunc)))', '<closure>'],
		['(func2 0)', '1']
	]);
});

test('LL(1) Scheme PrimOp and Closure Pred test', () => {
	schemeTest([
		['(set add +)', '+'],
		['(set add1 (lambda (x) (+ x 1)))', '<closure>'],

		['(primop? +)', 'T'],
		['(primop? add)', 'T'],
		['(primop? add1)', '()'],

		['(closure? +)', '()'],
		['(closure? add)', '()'],
		['(closure? add1)', 'T'],

		['(primop? list)', 'T'],

		// Just for fun:
		['(primop? primop?)', 'T'],
		['(primop? closure?)', 'T'],
		['(closure? primop?)', '()'],
		['(closure? closure?)', '()']
	]);
});

// [Test]
// public void StreamsTest()   // See Kamin pages 176-178 : "SASL vs. Scheme"
// {
//     // This Scheme code uses zero-argument closures to mimic SASL thunks.
//     // If s is a stream, (car s) is a number, and ((cadr s)) is a stream.
//     Evaluate(@"
// (set add-streams (lambda (s1 s2)
// (list (+ (car s1) (car s2)) (lambda () (add-streams ((cadr s1)) ((cadr s2)))))
// ))");
//     Evaluate(@"
// (set stream-first-n (lambda (n s)
// (if (= n 0) '()
// (cons (car s) (stream-first-n (- n 1) ((cadr s)))))
// ))");
//     Evaluate("(set powers-of-2 (list 1 (lambda () (add-streams powers-of-2 powers-of-2))))");
//     Evaluate("(set fibonacci (list 0 (lambda () (list 1 (lambda () (add-streams fibonacci ((cadr fibonacci))))))))");
//
//     Assert.AreEqual("(1 2 4 8 16)", Evaluate("(stream-first-n 5 powers-of-2)"));
//     Assert.AreEqual("(0 1 1 2 3 5 8 13)", Evaluate("(stream-first-n 8 fibonacci)"));
// }
//
// [Test]
// public void RplacaRplacdTest()  // See page 55
// {
//     Evaluate("(set x '(a b c))");
//     Evaluate("(set y x)");
//     Evaluate("(rplaca y 'd)");
//     Assert.AreEqual("(d b c)", Evaluate("y"));
//     Assert.AreEqual("(d b c)", Evaluate("x"));
//
//     Evaluate("(rplacd y 'e)");
//     Assert.AreEqual("(d . e)", Evaluate("y"));
//     Assert.AreEqual("(d . e)", Evaluate("x"));
// }
//
// [Test]
// public void MacroTest()     // From pages 56-57, and Exercise 12, from pages 62-63 (in the LISP chapter)
// {
//     Evaluate("(set <= (lambda (x y) (or (< x y) (= x y))))");
//     Evaluate(@"
// (define-macro for (indexvar lower upper body)
// (list 'begin
// (list 'set indexvar lower)
// (list 'while
//     (list '<= indexvar upper)
//     (list 'begin body
//         (list 'set indexvar (list '+ indexvar 1))))))");
//     Evaluate("(set sum 0)");
//     Evaluate("(for x 1 10 (set sum (+ sum x)))");
//     Assert.AreEqual("55", Evaluate("sum"));
// }
//
// [Test]
// public void RandomTest()
// {
//     const int maxValue = 100;
//     var x = int.Parse(Evaluate(string.Format("(random {0})", maxValue)));
//
//     Assert.IsTrue(x >= 0);
//     Assert.IsTrue(x < maxValue);
// }
//
// [Test]
// public void SetsTest()  // See pages 104-105
// {
//     globalInfo.LoadPreset("set");
//
//     Assert.AreEqual("(a b)", Evaluate("(set s1 (addelt 'a (addelt 'b nullset)))"));
//     Assert.AreEqual("T", Evaluate("(member? 'a s1)"));
//     Assert.AreEqual("()", Evaluate("(member? 'c s1)"));
//     Assert.AreEqual("(b c)", Evaluate("(set s2 (addelt 'b (addelt 'c nullset)))"));
//     Assert.AreEqual("(c a b)", Evaluate("(set s3 (union s1 s2))"));
// }
//
// private void DefineTermRewritingSystem()  // See section 4.4 on pages 116-122
// {
//     globalInfo.LoadPreset("set");   // For "member?"
//     //globalInfo.LoadPreset("compose");
//
//     // Functions from Figure 4.2 (on page 120)
//     Evaluate("(set fun-mod (lambda (f x y) (lambda (z) (if (= x z) y (f z)))))");
//     Evaluate("(set variable? (lambda (x) (member? x '(X Y))))");
//     Evaluate("(set empty-subst (lambda (x) 'unbound))");
//     Evaluate(@"
// (set mk-subst-fun
// (lambda (lhs e sigma)
// (if (variable? lhs)
//     (if (= (sigma lhs) 'unbound)
//         (fun-mod sigma lhs e)
//         (if (equal (sigma lhs) e) sigma 'nomatch))
//     (if (atom? lhs)
//         (if (= lhs e) sigma 'nomatch)
//         (if (atom? e) 'nomatch
//             (if (= (car lhs) (car e))
//                 (mk-subst-fun* (cdr lhs) (cdr e) sigma)
//                 'nomatch))))))");
//     Evaluate(@"
// (set mk-subst-fun*
// (lambda (lhs-lis exp-lis sigma)
// (if (null? lhs-lis) sigma
//     (begin
//         (set car-match
//             (mk-subst-fun (car lhs-lis) (car exp-lis) sigma))
//         (if (= car-match 'nomatch) 'nomatch
//             (mk-subst-fun* (cdr lhs-lis) (cdr exp-lis) car-match))))))");
//     Evaluate(@"
// (set extend-to-pat
// (lambda (sigma)
// (lambda (p)
//     (if (variable? p) (if (= (sigma p) 'unbound) p (sigma p))
//         (if (atom? p) p
//             (cons (car p)
//                 (mapcar (extend-to-pat sigma) (cdr p))))))))");
//
//     // Function from Figure 4.3 (on page 121)
//     Evaluate(@"
// (set mk-toplvl-rw-fn
// (lambda (rule)
// (lambda (e)
//     (begin
//         (set induced-subst (mk-subst-fun (car rule) e empty-subst))
//         (if (= induced-subst 'nomatch) '()
//             ((extend-to-pat induced-subst) (cadr rule)))))))");
//
//     // Functions from Figure 4.4 (on page 122)
//     Evaluate(@"
// (set apply-inside-exp
// (lambda (f)
// (lambda (e)
//     (begin
//         (set newe (f e))
//         (if newe newe
//             (if (atom? e) '()
//                 (begin
//                     (set newargs ((apply-inside-exp* f) (cdr e)))
//                     (if newargs (cons (car e) newargs) '()))))))))");
//     Evaluate(@"
// (set apply-inside-exp*
// (lambda (f)
// (lambda (l)
//     (if (null? l) '()
//         (begin
//             (set newfirstarg ((apply-inside-exp f) (car l)))
//             (if newfirstarg
//                 (cons newfirstarg (cdr l))
//                 (begin
//                     (set newrestofargs ((apply-inside-exp* f) (cdr l)))
//                     (if newrestofargs
//                         (cons (car l) newrestofargs) '()))))))))");
//     Evaluate("(set mk-rw-fn (compose mk-toplvl-rw-fn apply-inside-exp))");
//
//     // Functions from Figure 4.4 (on page 122)
//     Evaluate("(set failure (lambda (e) '()))");
//     Evaluate(@"
// (set compose-rewrites (lambda (f g)
// (lambda (x)
// ((lambda (fx) (if fx fx (g x))) (f x)))))");
//     Evaluate("(set mk-rw-fn* (combine mk-rw-fn compose-rewrites failure))");
//     Evaluate(@"
// (set repeat-fn
// (lambda (f)
// (lambda (e)
//     (begin
//         (set tmp (f e))
//         (if tmp ((repeat-fn f) tmp) e)))))");
//     Evaluate("(set compile-trs (compose mk-rw-fn* repeat-fn))");
//
//     // Differentiation: from page 116
//     Evaluate(@"
// (set diff-rules '(
// ((Dx x) 1)
// ((Dx c) 0)
// ((Dx (+ X Y)) (+ (Dx X) (Dx Y)))
// ((Dx (- X Y)) (- (Dx X) (Dx Y)))
// ((Dx (* X Y)) (+ (* Y (Dx X)) (* X (Dx Y))))
// ((Dx (/ X Y)) (/ (- (* Y (Dx X)) (* X (Dx Y))) (* Y Y)))))");
//     Evaluate("(set differentiate (compile-trs diff-rules))");
// }
//
// [Test]
// public void TermRewritingSystemsTest()  // See section 4.4 on pages 116-122
// {
//     DefineTermRewritingSystem();
//
//     Assert.AreEqual("(+ 1 0)", Evaluate("(differentiate '(Dx (+ x c)))"));
// }
//
// [Test]
// public void Exercise1Test() // Exercise 1 on pages 148-149.
// {
//     // Exercise 1a) : cdr*
//     Evaluate("(set cdr* (mapc cdr))");
//     Assert.AreEqual("((b c) (e) ())", Evaluate("(cdr* '((a b c) (d e) (f)))"));
//
//     // Exercise 1b) : max*
//     Evaluate("(set max (lambda (x y) (if (> x y) x y)))");
//     Evaluate("(set max* (combine id max 0))");
//     Assert.AreEqual("10", Evaluate("(max* '(1 5 10 3 7 2 8))"));
//
//     // Exercise 1c) : append (although we will call it append2 here)
//     Evaluate("(set append2 (lambda (l1 l2) ((combine id cons l2) l1)))");
//     Assert.AreEqual("(a b c d e f g)", Evaluate("(append2 '(a b c) '(d e f g))"));
//
//     // Exercise 1d) : addtoend
//     Evaluate("(set addtoend (lambda (x l) ((combine id cons (list x)) l)))");
//     Assert.AreEqual("(b c d a)", Evaluate("(addtoend 'a '(b c d))"));
//
//     // Exercise 1e) : reverse (although we will call it reverse2 here)
//     Evaluate("(set reverse2 (combine id addtoend '()))");
//     Assert.AreEqual("(g f e d c b a)", Evaluate("(reverse2 '(a b c d e f g))"));
//
//     // Exercise 1f) : insertion-sort
//     Evaluate(@"
// (set insert (lambda (x l)
// (cond
// ((null? l) (list x))
// ((<= x (car l)) (cons x l))
// ('T (cons (car l) (insert x (cdr l)))))))");
//     Evaluate("(set insertion-sort (combine id insert '()))");
//     Assert.AreEqual("(1 2 3 4 5 6 7)", Evaluate("(insertion-sort '(3 7 4 1 2 6 5))"));
//
//     // Exercise 1g) : mkpairsfn
//     Evaluate("(set mkpairsfn (lambda (x) (mapc (lambda (l) (cons x l)))))");
//     Assert.AreEqual("((a) (a b c) (a d) (a (e f)))",
//         Evaluate("((mkpairsfn 'a) '(() (b c) (d) ((e f))))"));
// }
//
// [Test]
// public void Exercise2Test() // Exercise 2 on page 149 : lex-order*
// {
//     Evaluate(@"
// (set lex-order* (lambda (cmp)
// (lambda (l1 l2)
// (cond
//     ((null? l1) (not (null? l2)))
//     ((null? l2) '())
//     ((cmp (car l1) (car l2)) 'T)
//     ((cmp (car l2) (car l1)) '())
//     ('T ((lex-order* cmp) (cdr l1) (cdr l2)))))))");
//     Evaluate("(set alpha-order (lex-order* <))");
//
//     Assert.AreEqual("T", Evaluate("(alpha-order '(4 15 7) '(4 15 7 5))"));
//     Assert.AreEqual("()", Evaluate("(alpha-order '(4 15 7) '(4 15 6 6))"));
// }
//
// [Test]
// public void Exercise3Test() // Exercise 3 on page 149 : Sets implemented using characteristic functions
// {
//     Evaluate("(set nullset (lambda (x) '()))");
//     Evaluate("(set member? (lambda (x s) (s x)))");
//     // mk-set-ops : See pages 106-107
//     Evaluate(@"
// (set mk-set-ops (lambda (eqfun)
// (cons (lambda (x s) (if (member? x s) s (lambda (y) (or (eqfun x y) (member? y s))))) ; addelt
// '())))");
//     Evaluate("(set addelt (car (mk-set-ops =)))");
//     Evaluate(@"
// (set union (lambda (s1 s2)
// (lambda (x) (or (member? x s1) (member? x s2)))))");
//     Evaluate(@"
// (set inter (lambda (s1 s2)
// (lambda (x) (and (member? x s1) (member? x s2)))))");
//     Evaluate(@"
// (set diff (lambda (s1 s2)
// (lambda (x) (and (member? x s1) (not (member? x s2))))))");
//
//     Evaluate("(set s1 (addelt 'a (addelt 'b nullset)))");
//     Assert.AreEqual("T", Evaluate("(member? 'a s1)"));
//     Assert.AreEqual("T", Evaluate("(member? 'b s1)"));
//     Assert.AreEqual("()", Evaluate("(member? 'c s1)"));
//
//     Evaluate("(set s2 (addelt 'b (addelt 'c nullset)))");
//     Evaluate("(set s3 (union s1 s2))");
//     Assert.AreEqual("T", Evaluate("(member? 'a s3)"));
//     Assert.AreEqual("T", Evaluate("(member? 'b s3)"));
//     Assert.AreEqual("T", Evaluate("(member? 'c s3)"));
//     Assert.AreEqual("()", Evaluate("(member? 'd s3)"));
//
//     Evaluate("(set s4 (inter s1 s2))");
//     Assert.AreEqual("()", Evaluate("(member? 'a s4)"));
//     Assert.AreEqual("T", Evaluate("(member? 'b s4)"));
//     Assert.AreEqual("()", Evaluate("(member? 'c s4)"));
//
//     Evaluate("(set s5 (diff s1 s2))");
//     Assert.AreEqual("T", Evaluate("(member? 'a s5)"));
//     Assert.AreEqual("()", Evaluate("(member? 'b s5)"));
//     Assert.AreEqual("()", Evaluate("(member? 'c s5)"));
// }
//
// [Test]
// public void Exercise4Test() // Exercise 4 on page 149 : Optimizing gcd* and gcds (from pages 108-109)
// {
//     // Part 1
//     Evaluate("(set gcd* (lambda (l) (gcd*-aux l id)))");
//     Evaluate(@"
// (set gcd*-aux (lambda (l f)
// (if (= (car l) 1) 1
// (if (null? (cdr l)) (f (car l))
//     (gcd*-aux (cdr l)
//         (lambda (n)
//             (let ((gcd-value (gcd (car l) n)))
//                 (if (= gcd-value 1) 1 (f gcd-value)))))))))");
//
//     Assert.AreEqual("7", Evaluate("(gcd* '(14 49 98))"));
//     Assert.AreEqual("1", Evaluate("(gcd* '(3 5 7 9 11))"));
//     Assert.AreEqual("1", Evaluate("(gcd* '(NotANumber 3 5))"));    // The gcd is calculated from the arguments from right to left.
//
//     // Part 2
//     Evaluate("(set gcds (lambda (s) (gcds-aux s id)))");
//     Evaluate(@"
// (set gcds-aux (lambda (s f)
// (if (number? s) (if (= s 1) 1 (f s))
// (if (null? (cdr s))
//     (gcds-aux (car s) f)
//     (gcds-aux (car s)
//         (lambda (n) (gcds-aux (cdr s)
//             (lambda (p)
//                 (let ((gcd-value (gcd n p)))
//                     (if (= gcd-value 1) 1 (f (gcd n p))))))))))))");
//
//     Assert.AreEqual("7", Evaluate("(gcds '((14 (49 98)) 56 ((84 105 21) 91 77)))"));
//     Assert.AreEqual("1", Evaluate("(gcds '((3 5) 7 (9 11)))"));
//     //Assert.AreEqual("1", Evaluate("(gcds '((NotANumber 3) 5))")); // gcds only accepts S-expressions of numbers and pairs (lists), not symbols.
// }
//
// [Test]
// public void Exercise5aTest()  // Exercise 5a on pages 150-151; TermRewritingSystems
// {
//     DefineTermRewritingSystem();
//
//     // Old code; from the text.
//     //Evaluate("(set mk-rw-fn* (combine mk-rw-fn compose-rewrites failure))");
//
//     // New code.
//     Evaluate("(set mk-toplvl-rw-fn* (combine mk-toplvl-rw-fn compose-rewrites failure))"); // Apply any of the rules at the top level of an expression.
//     Evaluate("(set mk-rw-fn* (compose mk-toplvl-rw-fn* apply-inside-exp))"); // Extend the above to operate inside expressions.
//
//     Assert.AreEqual("(+ 1 0)", Evaluate("(differentiate '(Dx (+ x c)))"));
// }
//
// [Test]
// public void Exercise5bTest()  // Exercise 5b on pages 150-151; TermRewritingSystems; modifications to apply-inside-exp
// {
//     DefineTermRewritingSystem();
//
//     // The next two functions are new or rewritten.
//     Evaluate(@"
// (set apply-func
// (lambda (f)
// (lambda (x)
//     (let ((result ((apply-inside-exp f) x)))
//         (if result result x)))))");
//     Evaluate(@"
// (set apply-inside-exp*
// (lambda (f)
// (lambda (l)
//     (let ((result (mapcar (apply-func f) l)))
//         (if (equal result l) '() result)))))");
//
//     Assert.AreEqual("(+ 1 0)", Evaluate("(differentiate '(Dx (+ x c)))"));
// }
//
// [Test]
// public void LetMacroTest()  // Part of exercise 15 on page 152.
// {
//     Evaluate("(set list-of-cars (lambda (l) (mapcar car l)))");
//     Evaluate("(set list-of-cadrs (lambda (l) (mapcar cadr l)))");
//     Evaluate(@"
// (define-macro letm (declarations body)
// (cons
// (list 'lambda (list-of-cars declarations) body)
// (list-of-cadrs declarations)))");
//     Assert.AreEqual("(12 5)", Evaluate("(letm ((m (* 3 4)) (n (+ 2 3))) (list m n))"));
// }
//
// [Test]
// public void LetStarMacroTest()  // Part of exercise 15 on page 152.
// {
//     Evaluate(@"
// (set build-expr
// (lambda (declarations body)
// (if (null? declarations) body
//     (list
//         (list 'lambda
//             (list (car (car declarations)))
//             (build-expr (cdr declarations) body))
//         (cadr (car declarations))))))");
//     Evaluate("(define-macro let*m (declarations body) (build-expr declarations body))");
//     Assert.AreEqual("25", Evaluate("(let*m ((x (+ 2 3)) (y (* x x))) y)"));
// }
//
// [Test]
// public void LetRecMacroTest()  // Part of exercise 15 on page 152.
// {
//     Evaluate(@"
// (set build-let-declaration
// (lambda (declaration)
// (list (car declaration) 0)))");
//     Evaluate(@"
// (set build-set-statement
// (lambda (declaration)
// (cons 'set declaration)))");
//     Evaluate(@"
// (define-macro letrecm (declarations body)
// (list 'let (mapcar build-let-declaration declarations)
// (cons 'begin
//     (append
//         (mapcar build-set-statement declarations)
//         (list body)))))");
//
//     /*
//     Assert.AreEqual("4", Evaluate(@"
// (letrecm
// ((countones (lambda (l)
// (if (null? l) 0
//     (if (= (car l) 1) (+ 1 (countones (cdr l)))
//         (countones (cdr l)))))))
// (countones (quote (1 2 3 1 0 1 1 5))))"));
//      */
//     Assert.AreEqual("4", Evaluate(@"
// (letrecm
// ((countones (lambda (l)
// (if (null? l) 0
//     (if (= (car l) 1) (+ 1 (countones (cdr l)))
//         (countones (cdr l)))))))
// (countones '(1 2 3 1 0 1 1 5)))"));
// }
//
// [Test]
// public void EvalInSchemeTest()  // From section 4.5, on pages 123-124.  Also part of exercise 17 on page 152.
// {
//     globalInfo.LoadPreset("assoc");
//     globalInfo.LoadPreset("select");
//
//     Evaluate("(set caddr (lambda (l) (cadr (cdr l))))");
//     Evaluate("(set cadddr (lambda (l) (caddr (cdr l))))");
//
//     // Functions adapted from page 48
//     Evaluate(@"
// (set apply-binary-op (lambda (f x y)
// (cond
// ((= f 'cons) (cons x y))
// ((= f '+) (+ x y))
// ((= f '-) (- x y))
// ((= f '*) (* x y))
// ((= f '/) (/ x y))
// ((= f '<) (< x y))
// ((= f '>) (> x y))
// ((= f '=) (= x y))
// ('T 'binary-op-error!))))");
//     Evaluate(@"
// (set apply-unary-op (lambda (f x)
// (cond
// ((= f 'car) (car x))
// ((= f 'cdr) (cdr x))
// ((= f 'number?) (number? x))
// ((= f 'list?) (list? x))
// ((= f 'symbol?) (symbol? x))
// ((= f 'null?) (null? x))
// ((= f 'closure?) (is-closure? x))
// ((= f 'primop?) (is-primop? x))
// ('T 'unary-op-error!)
// ; ('T f)
// )))");
//
//     // From page 123
//     Evaluate("(set formals (lambda (lamexp) (cadr lamexp)))");
//     Evaluate("(set body (lambda (lamexp) (caddr lamexp)))");
//     Evaluate("(set funpart (lambda (clo) (cadr clo)))");
//     Evaluate("(set envpart (lambda (clo) (caddr clo)))");
//
//     // begin
//     Evaluate(@"
// (set do-begin (lambda (expr-list rho)
// (if (null? (cdr expr-list))
// (eval (car expr-list) rho)
// (begin
//     (eval (car expr-list) rho)
//     (do-begin (cdr expr-list) rho)))))");
//     // let
//     Evaluate("(set construct-let-var-list (mapc car))");
//     Evaluate("(set construct-let-expr-list (mapc cadr))");
//     Evaluate(@"
// (set do-let (lambda (var-expr-list expr rho)
// (eval
// (cons
//     (list 'lambda (construct-let-var-list var-expr-list) expr)
//     (construct-let-expr-list var-expr-list))
// rho)))");
//     // let*
//     Evaluate(@"
// (set construct-let* (lambda (var-expr-list expr)
// (if (null? var-expr-list) expr
// (list
//     (list
//         'lambda
//         (list (caar var-expr-list))
//         (construct-let* (cdr var-expr-list) expr))
//     (cadar var-expr-list)))))");
//     Evaluate(@"
// (set do-let* (lambda (var-expr-list expr rho)
// (eval (construct-let* var-expr-list expr) rho)))");
//     // letrec
//     Evaluate(@"
// (set construct-letrec-let-body (lambda (var-expr-list)
// (if (null? var-expr-list) '()
// (cons
//     (list (caar var-expr-list) 0)
//     (construct-letrec-let-body (cdr var-expr-list))))))");
//     Evaluate(@"
// (set construct-letrec-begin-body (lambda (var-expr-list expr)
// (if (null? var-expr-list) (list expr)
// (cons
//     (cons 'set (car var-expr-list))
//     (construct-letrec-begin-body (cdr var-expr-list) expr)))))");
//     Evaluate(@"
// (set construct-letrec (lambda (var-expr-list expr)
// (list 'let (construct-letrec-let-body var-expr-list)
// (cons 'begin (construct-letrec-begin-body var-expr-list expr)))))");
//     Evaluate(@"
// (set do-letrec (lambda (var-expr-list expr rho)
// (eval (construct-letrec var-expr-list expr) rho)))");
//     // cond
//     Evaluate(@"
// (set do-cond (lambda (expr-pair-list rho)
// (if (null? expr-pair-list) '()
// (if (eval (caar expr-pair-list) rho)
//     (eval (cadar expr-pair-list) rho)
//     (do-cond (cdr expr-pair-list) rho)))))");
//
//     // Functions from Figure 4.6 on page 124
//     Evaluate(@"
// (set eval (lambda (expr env)
// (cond
// ((number? expr) expr)
// ((symbol? expr)
//     (if (assoc-contains-key expr env)
//         (assoc expr env)
//         (assoc expr global-environment)))
// ((= (car expr) 'quote) (cadr expr))
// ((= (car expr) 'if)
//     (if (null? (eval (cadr expr) env))
//         (eval (cadddr expr) env)
//         (eval (caddr expr) env)))
// ((= (car expr) 'begin) (do-begin (cdr expr) env)) ; Exercise 6a) on page 61
// ((= (car expr) 'print) ; Exercise 6a) on page 61
//     (print (eval (cadr expr) env)))
// ((= (car expr) 'set)
//     (let ((evaluated-expression (eval (caddr expr) env)))
//         (if (assoc-contains-key (cadr expr) env)
//             (begin
//                 (rplac-assoc (cadr expr) evaluated-expression env)
//                 evaluated-expression)
//             (begin
//                 (set global-environment (mkassoc (cadr expr) evaluated-expression global-environment))
//                 evaluated-expression))))
// ((= (car expr) 'let) (do-let (cadr expr) (caddr expr) env))
// ((= (car expr) 'let*) (do-let* (cadr expr) (caddr expr) env))
// ((= (car expr) 'letrec) (do-letrec (cadr expr) (caddr expr) env))
// ((= (car expr) 'cond) (do-cond (cdr expr) env))
// ((= (car expr) 'lambda) (list 'closure expr env))
// ((= (car expr) 'list) (evallist (cdr expr) env))
// ('T (apply (evallist expr env) env))
// )))");
//     Evaluate(@"
// (set evallist (lambda (el rho)
// (if (null? el) '()
// (cons
//     (eval (car el) rho)
//     (evallist (cdr el) rho)))))");
//     Evaluate(@"
// (set mkassoc* (lambda (keys values al)
// (if (null? keys) al
// (mkassoc* (cdr keys) (cdr values)
//     (mkassoc (car keys) (car values) al)))))");
//     Evaluate(@"
// (set apply (lambda (el env)
// (if (is-closure? (car el))
// (apply-closure (car el) (cdr el))
// (apply-value-op (car el) (cdr el)))))");
//     Evaluate(@"
// (set apply-closure (lambda (clo args)
// (eval (body (funpart clo))
// (mkassoc* (formals (funpart clo)) args (envpart clo)))))");
//     Evaluate(@"
// (set apply-value-op (lambda (primop args)
// (if (= (length args) 1)
// (apply-unary-op (cadr primop) (car args))
// (apply-binary-op (cadr primop) (car args) (cadr args)))))");
//     Evaluate("(set is-closure? (lambda (f) (= (car f) 'closure)))");
//     Evaluate("(set is-primop? (lambda (f) (= (car f) 'primop)))");
//     Evaluate(@"
// (set valueops '(
// (+ (primop +))
// (- (primop -))
// (cons (primop cons))
// (* (primop *))
// (/ (primop /))
// (< (primop <))
// (> (primop >))
// (= (primop =))
// (cdr (primop cdr))
// (car (primop car))
// (number? (primop number?))
// (list? (primop list?))
// (symbol? (primop symbol?))
// (null? (primop null?))
// (closure? (primop closure?))
// (primop? (primop primop?))))");
//
//     // Functions adapted from Figure 2.8
//     Evaluate(@"
// (set r-e-p-loop (lambda (inputs)
// (begin
// (set global-environment '())
// (r-e-p-loop* inputs))))");
//     Evaluate(@"
// (set r-e-p-loop* (lambda (inputs)
// (if (null? inputs) '()
// (process-expr (car inputs) (cdr inputs)))))");
//     Evaluate(@"
// (set process-expr (lambda (e inputs)
// (cons (eval e valueops) ; print value of expression
// (r-e-p-loop* inputs))))");
//
//     Assert.AreEqual("5", Evaluate("(eval '(+ 2 3) valueops)"));
//
//     // Test from page 123
//     Evaluate("(set E (mkassoc 'double (eval '(lambda (a) (+ a a)) valueops) valueops))");
//     Assert.AreEqual("8", Evaluate("(eval '(double 4) E)"));
//
//     // select test
//     Assert.AreEqual("(12 16 18)", Evaluate("(select '(1 3 4) '(10 12 14 16 18 20))"));
//
//     // Test of "set" to ensure that we have completed the exercise.
//     Assert.AreEqual("(8 () T)", Evaluate(@"
// (select '(1 2 3) (r-e-p-loop '( ; We use 'select' because we don't want to test the value of the closure 'double'.
// (set double (lambda (a) (+ a a)))
// (double 4)
// (primop? double)
// (closure? double)
// )))"));
//
//     // letrec test: from Kamin page 126.
//     /*
//     Assert.AreEqual("(4)", Evaluate(@"
// (r-e-p-loop '(
// (letrec ; Try a letrec wth two bindings
// (
//  (countzeroes (lambda (l)
//     (if (null? l) 0
//         (if (= (car l) 0) (+ 1 (countzeroes (cdr l)))
//             (countzeroes (cdr l))))))
//  (countones (lambda (l)
//     (if (null? l) 0
//         (if (= (car l) 1) (+ 1 (countones (cdr l)))
//             (countones (cdr l))))))
// )
// (countones (quote (1 2 3 1 0 1 1 5))))
// ))"));
//      */
//     Assert.AreEqual("(4)", Evaluate(@"
// (r-e-p-loop (list
// (list 'letrec ; Try a letrec wth two bindings
// '(
//  (countzeroes (lambda (l)
//     (if (null? l) 0
//         (if (= (car l) 0) (+ 1 (countzeroes (cdr l)))
//             (countzeroes (cdr l))))))
//  (countones (lambda (l)
//     (if (null? l) 0
//         (if (= (car l) 1) (+ 1 (countones (cdr l)))
//             (countones (cdr l))))))
// )
// (list 'countones (list 'quote '(1 2 3 1 0 1 1 5))))
// ))"));
//
//     // Test of letrec (see exercise 6 on page 150)
// #if DEAD_CODE
//     Assert.AreEqual("(15 120 54)", Evaluate(@"
// (select '(1 2 3) (r-e-p-loop '(
// (set eval-ex6 (lambda (e)
// (letrec
//     ((combine (lambda (f sum zero) (lambda (l) (if (null? l) zero (sum (f (car l)) ((combine f sum zero) (cdr l)))))))
//      (id (lambda (x) x))
//      (+/ (combine id + 0))
//      (*/ (combine id * 1))
//      (ev (lambda (expr)
//         (if (number? expr) expr
//             (if (= (car expr) (quote +))
//                 (+/ (evlis (cdr expr)))
//                 (*/ (evlis (cdr expr)))))))
//      (mapcar (lambda (f l) (if (null? l) l (cons (f (car l)) (mapcar f (cdr l))))))
//      (curry (lambda (f) (lambda (x) (lambda (y) (f x y)))))
//      (mapc (curry mapcar))
//      (evlis (mapc ev))
//     )
//     (ev e))))
// (eval-ex6 (quote (+ 1 2 3 4 5)))
// (eval-ex6 (quote (* 1 2 3 4 5)))
// (eval-ex6 (quote (* (+ 1 2 3) (+ 4 5))))
// )))"));
// #else
//     Assert.AreEqual("(15 120 54)", Evaluate(@"
// (select '(1 2 3) (r-e-p-loop (list
// (list 'set 'eval-ex6 (list 'lambda '(e)
// (list 'letrec
//     (list
//      '(combine (lambda (f sum zero) (lambda (l) (if (null? l) zero (sum (f (car l)) ((combine f sum zero) (cdr l)))))))
//      '(id (lambda (x) x))
//      '(+/ (combine id + 0))
//      '(*/ (combine id * 1))
//      (list 'ev (list 'lambda '(expr)
//         (list 'if '(number? expr) 'expr
//             (list 'if (list '= '(car expr) (list 'quote '+))
//                 '(+/ (evlis (cdr expr)))
//                 '(*/ (evlis (cdr expr)))))))
//      '(mapcar (lambda (f l) (if (null? l) l (cons (f (car l)) (mapcar f (cdr l))))))
//      '(curry (lambda (f) (lambda (x) (lambda (y) (f x y)))))
//      '(mapc (curry mapcar))
//      '(evlis (mapc ev))
//     )
//     '(ev e))))
// (list 'eval-ex6 (list 'quote '(+ 1 2 3 4 5)))
// (list 'eval-ex6 (list 'quote '(* 1 2 3 4 5)))
// (list 'eval-ex6 (list 'quote '(* (+ 1 2 3) (+ 4 5))))
// )))"));
// #endif
//
//
//     // Note: If you get an error saying that car's argument is null, it is probably because you forgot to declare something
//     // (e.g. a function like id or mapc).
//
//     // "list" tests.
//     Assert.AreEqual("((2 3 5 7) (1 2 3 5))", Evaluate(@"
// (r-e-p-loop '(
// (list 2 3 5 7)
// (list (+ 0 1) (+ 1 1) (+ 1 2) (+ 2 3))
// ))"));
//
//     // Test of the "set" implementation that uses rplac-assoc.
//     Assert.AreEqual("(14)", Evaluate(@"
// (select '(1) (r-e-p-loop '(
// (set f (lambda (n)
// (let ((g (lambda ()
//         (begin
//             (set n (+ n 1))
//             0))))
//     (begin
//         (g)
//         n))))
// (f 13)
// )))"));
//
//     // Test of the "let" implementation that uses lambda.
//     Assert.AreEqual("(60)", Evaluate(@"
// (r-e-p-loop '(
// (let ((a 2) (b 3) (c 5) (d (+ 3 4)))
// (* (+ a b) (+ c d)))
// ))"));
//
//     // Test of the "let*" implementation that uses nested lambda expressions.
//     Assert.AreEqual("(24)", Evaluate(@"
// (r-e-p-loop '(
// (let* ((a 1) (b (* a 2)) (c (* b 3)) (d (* c 4)))
// d)
// ))"));
// }
//
// [Test]
// public void APLEvalTest()
// {
//     globalInfo.LoadPreset("assoc");
//     globalInfo.LoadPreset("select");
//     globalInfo.LoadPreset("flatten");
//     //globalInfo.LoadPreset("compose");
//
//     Evaluate("(set cddr (compose cdr cdr))");
//     Evaluate("(set caddr (compose cdr cadr))");
//     Evaluate("(set cadddr (compose cdr caddr))");
//
//     Evaluate(@"
// (set get-type (lambda (x)
// (cond
// ((number? x) 'scalar)
// ((null? x) 'vector)
// ((number? (car x)) 'vector)
// ('T 'matrix))))");
//     Evaluate("(set s1 7)");
//     Evaluate("(set v1 '(2 3 5 7))");
//     Evaluate("(set m1 '((3 4) 1 2 3 4 5 6 7 8 9 10 11 12))");
//
//     Assert.AreEqual("scalar", Evaluate("(get-type s1)"));
//     Assert.AreEqual("vector", Evaluate("(get-type '())"));
//     Assert.AreEqual("vector", Evaluate("(get-type v1)"));
//     Assert.AreEqual("matrix", Evaluate("(get-type m1)"));
//
//     Evaluate(@"
// (set shape (lambda (x)
// (let ((type (get-type x)))
// (cond
//     ((= type 'scalar) '())
//     ((= type 'vector) (list (length x)))
//     ('T (car x))))))");
//
//     Assert.AreEqual("()", Evaluate("(shape s1)"));
//     Assert.AreEqual("(4)", Evaluate("(shape v1)"));
//     Assert.AreEqual("(3 4)", Evaluate("(shape m1)"));
//
//     Evaluate(@"
// (set to-vector (lambda (x)
// (let ((type (get-type x)))
// (cond
//     ((= type 'scalar) (list x))
//     ((= type 'vector) x)
//     ('T (cdr x))))))");
//
//     Assert.AreEqual("(7)", Evaluate("(to-vector s1)"));
//     Assert.AreEqual("(2 3 5 7)", Evaluate("(to-vector v1)"));
//     Assert.AreEqual("(1 2 3 4 5 6 7 8 9 10 11 12)", Evaluate("(to-vector m1)"));
//
//     Evaluate(@"
// (set get-first-scalar (lambda (x)
// (let ((type (get-type x)))
// (cond
//     ((= type 'scalar) x)
//     ((= type 'vector) (car x))
//     ('T (cadr x))))))");
//     Assert.AreEqual("7", Evaluate("(get-first-scalar 7)"));
//     Assert.AreEqual("13", Evaluate("(get-first-scalar '(13 14 15))"));
//     Assert.AreEqual("9", Evaluate("(get-first-scalar '((2 2) 9 3 5 7))"));
//
//     Evaluate("(set +/ (combine id + 0))");
//     Evaluate("(set -/ (combine id - 0))");
//     Evaluate("(set */ (combine id * 1))");
//     Evaluate("(set // (combine id / 1))");
//     Evaluate("(set to-scalar-if-possible (lambda (x) (if (= (*/ (shape x)) 1) (get-first-scalar x) x)))");
//     Assert.AreEqual("13", Evaluate("(to-scalar-if-possible 13)"));
//     Assert.AreEqual("7", Evaluate("(to-scalar-if-possible '(7))"));
//     Assert.AreEqual("(8 9)", Evaluate("(to-scalar-if-possible '(8 9))"));
//     Assert.AreEqual("20", Evaluate("(to-scalar-if-possible '((1 1) 20))"));
//     Assert.AreEqual("((2 2) 1 0 0 1)", Evaluate("(to-scalar-if-possible '((2 2) 1 0 0 1))"));
//
//     Evaluate(@"
// (set get-matrix-rows (lambda (m)
// (letrec ((get-matrix-rows* (lambda (r c l)
//     (if (= r 0) '()
//         (cons (take c l) (get-matrix-rows* (- r 1) c (skip c l)))))))
// (get-matrix-rows* (caar m) (cadar m) (cdr m)))))");
//
//     Assert.AreEqual("((1 2 3 4) (5 6 7 8) (9 10 11 12))", Evaluate("(get-matrix-rows m1)"));
//
//     Evaluate("(set max-of-pair (lambda (x y) (if (> x y) x y)))");
//     Evaluate("(set max/ (lambda (l) ((combine id max-of-pair (car l)) (cdr l))))");
//     Evaluate("(set apl-and (lambda (x y) (if (and (<> x 0) (<> y 0)) 1 0)))");
//     Evaluate("(set apl-or (lambda (x y) (if (or (<> x 0) (<> y 0)) 1 0)))");
//     Evaluate("(set and/ (combine id apl-and 1))");
//     Evaluate("(set or/ (combine id apl-or 0))");
//     Evaluate(@"
// (set m-to-n (lambda (m n)
// (if (> m n) '()
// (cons m (m-to-n (+1 m) n)))))");
//     Evaluate(@"
// (set repeat (lambda (n l)
// (letrec ((repeat* (lambda (n l l-original)
//         (cond
//             ((= n 0) '())
//             ((null? l) (repeat* n l-original l-original))
//             ('T (cons (car l) (repeat* (- n 1) (cdr l) l-original)))))))
// (repeat* n l l))))");
//     Evaluate(@"
// (set restruct (lambda (desired-shape src-data)
// (let* ((length-of-desired-shape (length desired-shape))
//    (src-vector (to-vector src-data))
//    (dst-vector (repeat (*/ desired-shape) src-vector)))
// (cond
//     ((= length-of-desired-shape 0) 'restruct-to-scalar-error)
//     ((= length-of-desired-shape 1) dst-vector)
//     ('T (cons desired-shape dst-vector))))))");
//     Evaluate(@"
// (set trans (lambda (matrix)
// (letrec ((get-column (lambda (n l) (mapcar ((curry nth) n) l)))
//      (get-data (lambda (n num-cols l)
//         (if (< n num-cols)
//             (append (get-column n l) (get-data (+1 n) num-cols l))
//             '())))
//      (new-shape (list (cadar matrix) (caar matrix))))
// (cons new-shape (get-data 0 (cadar matrix) (get-matrix-rows matrix))))))");
//     Evaluate(@"
// (set [] (lambda (x y)
// (let ((type-of-x (get-type x))
//   (type-of-y (get-type y))
//   (vector-y (to-vector y))
//   (nth*-reversed-args (lambda (l n) (nth (- n 1) l))))
// (cond
//     ((= type-of-x 'scalar) '[]-x-scalar-error)
//     ((= type-of-y 'matrix) '[]-x-matrix-error)
//     ((= type-of-x 'vector) (mapcar ((curry nth*-reversed-args) x) vector-y))
//     ('T (restruct
//         (list (length vector-y) (cadar x))
//         (flatten (mapcar ((curry nth*-reversed-args) (get-matrix-rows x)) vector-y))))))))");
//     // Binary operators to implement:
//     // - compress
//     Evaluate(@"
// (set compress (lambda (x y)
// (letrec ((type-of-x (get-type x))
//      (type-of-y (get-type y))
//      (is-logical (lambda (v)
//         (if (null? v) 'T
//             (if (or (= (car v) 0) (= (car v) 1))
//                 (is-logical (cdr v))
//                 '()))))
//      (compress* (lambda (logv l)
//         (if (or (null? logv) (null? l)) '()
//             (if (= (car logv) 0)
//                 (compress* (cdr logv) (cdr l))
//                 (cons (car l) (compress* (cdr logv) (cdr l))))))))
// (cond
//     ((<> type-of-x 'vector) 'compress-x-not-vector-error)
//     ((not (is-logical x)) 'compress-vector-not-logical-error)
//     ((= type-of-y 'scalar) 'compress-y-scalar-error)
//     ((= type-of-y 'vector) (compress* x y))
//     ('T (restruct
//         (list (+/ x) (cadar y))
//         (flatten (compress* x (get-matrix-rows y)))))))))");
//     Evaluate(@"
// (set apply-binary-op (lambda (f x y)
// (letrec ((combine2 (lambda (f l1 l2)
//         (if (or (null? l1) (null? l2)) '()
//             (cons (f (car l1) (car l2)) (combine2 f (cdr l1) (cdr l2))))))
//      (apply-scalar-scalar (lambda (f x y) (f x y)))
//      (apply-scalar-vector (lambda (f x y) (mapcar (lambda (z) (f x z)) y)))
//      (apply-scalar-matrix (lambda (f x y) (cons (car y) (mapcar (lambda (z) (f x z)) (cdr y)))))
//      (apply-vector-scalar (lambda (f x y) (mapcar (lambda (z) (f z y)) x)))
//      (apply-vector-vector (lambda (f x y)
//         (if (= (length x) (length y))
//             (combine2 f x y)
//             'binary-op-vector-shape-mismatch)))
//      (apply-matrix-scalar (lambda (f x y) (cons (car x) (mapcar (lambda (z) (f z y)) (cdr x)))))
//      (apply-matrix-matrix (lambda (f x y)
//         (if (equal (car x) (car y))
//             (cons (car x) (combine2 f (cdr x) (cdr y)))
//             'binary-op-matrix-shape-mismatch)))
//      (apply-binary-op* (lambda (f x y)
//         (begin
//             (set x (to-scalar-if-possible x))
//             (set y (to-scalar-if-possible y))
//             (let ((type-of-x (get-type x))
//                   (type-of-y (get-type y)))
//                 (cond
//                     ((= type-of-x 'scalar)
//                         (cond
//                             ((= type-of-y 'scalar) (apply-scalar-scalar f x y))
//                             ((= type-of-y 'vector) (apply-scalar-vector f x y))
//                             ('T (apply-scalar-matrix f x y))))
//                     ((= type-of-x 'vector)
//                         (cond
//                             ((= type-of-y 'scalar) (apply-vector-scalar f x y))
//                             ((= type-of-y 'vector) (apply-vector-vector f x y))
//                             ('T 'binary-op-vector-matrix-error)))
//                     ((= type-of-x 'matrix)
//                         (cond
//                             ((= type-of-y 'scalar) (apply-matrix-scalar f x y))
//                             ((= type-of-y 'vector) 'binary-op-matrix-vector-error)
//                             ('T (apply-matrix-matrix f x y)))))))))
//      (apl< (lambda (x y) (if (< x y) 1 0)))
//      (apl> (lambda (x y) (if (> x y) 1 0)))
//      (apl= (lambda (x y) (if (= x y) 1 0))))
// (cond
//     ((= f '+) (apply-binary-op* + x y))
//     ((= f '-) (apply-binary-op* - x y))
//     ((= f '*) (apply-binary-op* * x y))
//     ((= f '/) (apply-binary-op* / x y))
//     ((= f '<) (apply-binary-op* apl< x y))
//     ((= f '>) (apply-binary-op* apl> x y))
//     ((= f '=) (apply-binary-op* apl= x y))
//     ((= f 'max) (apply-binary-op* max-of-pair x y))
//     ((= f 'and) (apply-binary-op* apl-and x y))
//     ((= f 'or) (apply-binary-op* apl-or x y))
//     ((= f 'restruct) (restruct x y))
//     ((= f 'cat) (append (to-vector x) (to-vector y)))
//     ((= f '[]) ([] x y))
//     ((= f 'compress) (compress x y))
//     ('T 'binary-op-error!)
// ))))");
//     Evaluate(@"
// (set apply-unary-op (lambda (f x)
// (let* ((type-of-x (get-type x))
//    (apply-reduction-op (lambda (f x)
//         (cond
//             ((= type-of-x 'scalar) 'scalar-reduction-error)
//             ((= type-of-x 'vector) (f x))
//             ('T (mapcar f (get-matrix-rows x)))))))
// (cond
//     ((= f '+/) (apply-reduction-op +/ x))
//     ((= f '-/) (apply-reduction-op -/ x))
//     ((= f '*/) (apply-reduction-op */ x))
//     ((= f '//) (apply-reduction-op // x))
//     ((= f 'max/) (apply-reduction-op max/ x))
//     ((= f 'and/) (apply-reduction-op and/ x))
//     ((= f 'or/) (apply-reduction-op or/ x))
//     ((= f 'shape) (shape x))
//     ((= f 'indx) (m-to-n 1 x))
//     ((= f 'ravel) (to-vector x))
//     ((= f 'trans) (trans x))
//     ('T 'unary-op-error!)
//     ; ('T f)
// ))))");
//
//     // begin
//     Evaluate(@"
// (set do-begin (lambda (expr-list rho fundefs)
// (if (null? (cdr expr-list))
// (eval (car expr-list) rho fundefs)
// (begin
//     (eval (car expr-list) rho fundefs)
//     (do-begin (cdr expr-list) rho fundefs)))))");
//
//     Evaluate(@"
// (set eval (lambda (expr rho fundefs)
// (cond
// ((number? expr) expr)
// ((symbol? expr)
//     (if (assoc-contains-key expr rho)
//         (assoc expr rho)
//         (assoc expr global-environment)))
// ((= (car expr) 'quote) (cadr expr))
// ((= (car expr) 'if)
//     (if (= 0 (get-first-scalar (eval (cadr expr) rho fundefs)))
//         (eval (cadddr expr) rho fundefs)
//         (eval (caddr expr) rho fundefs)))
// ((= (car expr) 'begin) (do-begin (cdr expr) rho fundefs)) ; Exercise 6a) on page 61
// ((= (car expr) 'print) ; Exercise 6a) on page 61
//     (print (eval (cadr expr) rho fundefs)))
// ((= (car expr) 'set)
//     (let ((evaluated-expression (eval (caddr expr) rho fundefs)))
//         (if (assoc-contains-key (cadr expr) rho)
//             (begin
//                 (rplac-assoc (cadr expr) evaluated-expression rho)
//                 evaluated-expression)
//             (begin
//                 (set global-environment (mkassoc (cadr expr) evaluated-expression global-environment))
//                 evaluated-expression))))
// ((userfun? (car expr) fundefs)
//     (apply-userfun
//         (assoc (car expr) fundefs)
//         (evallist (cdr expr) rho fundefs)
//         fundefs))
// ((= (length expr) 2)
//     (apply-unary-op (car expr) (eval (cadr expr) rho fundefs)))
// ('T (apply-binary-op (car expr)
//         (eval (cadr expr) rho fundefs)
//         (eval (caddr expr) rho fundefs))))))");
//     Evaluate("(set userfun? (lambda (f fundefs) (assoc-contains-key f fundefs)))");
//     Evaluate(@"
// (set apply-userfun (lambda (fundef args fundefs)
// (eval (cadr fundef) ; body of function
// (mkassoc* (car fundef) args '()) ; local env
// fundefs)))");
//     Evaluate(@"
// (set evallist (lambda (el rho fundefs)
// (if (null? el) '()
// (cons (eval (car el) rho fundefs)
//     (evallist (cdr el) rho fundefs)))))");
//     Evaluate(@"
// (set mkassoc* (lambda (keys values al)
// (if (null? keys) al
// (mkassoc* (cdr keys) (cdr values)
//     (mkassoc (car keys) (car values) al)))))");
//
//     Evaluate(@"
// (set r-e-p-loop (lambda (inputs)
// (begin
// (set global-environment '())
// (r-e-p-loop* inputs '()))))");
//     Evaluate(@"
// (set r-e-p-loop* (lambda (inputs fundefs)
// (cond
// ((null? inputs) '()) ; session done
// ((atom? (car inputs)) ; input is variable or number
//     (process-expr (car inputs) (cdr inputs) fundefs))
// ((= (caar inputs) 'define) ; input is function definition
//     (process-def (car inputs) (cdr inputs) fundefs))
// ('T (process-expr (car inputs) (cdr inputs) fundefs)))))");
//     Evaluate(@"
// (set process-def (lambda (e inputs fundefs)
// (cons (cadr e) ; echo function name
// (r-e-p-loop* inputs
//     (mkassoc (cadr e) (cddr e) fundefs)))))");
//     Evaluate(@"
// (set process-expr (lambda (e inputs fundefs)
// (cons (eval e '() fundefs) ; print value of expression
// (r-e-p-loop* inputs fundefs))))");
//
//     // indx test
//     Assert.AreEqual("((1 2 3 4 5 6 7 8))", Evaluate(@"
// (r-e-p-loop '(
// (indx 8)
// ))"));
//
//     // max/ test
//     /*
//     Assert.AreEqual("(8 (10 9 12))", Evaluate(@"
// (r-e-p-loop '(
// (max/ (quote (2 4 6 8 1 3 5 7)))
// (max/ (quote ((3 4) 8 4 10 1 9 2 5 7 3 11 6 12)))
// ))"));
//      */
//     Assert.AreEqual("(8 (10 9 12))", Evaluate(@"
// (r-e-p-loop (list
// (list 'max/ (list 'quote '(2 4 6 8 1 3 5 7)))
// (list 'max/ (list 'quote '((3 4) 8 4 10 1 9 2 5 7 3 11 6 12)))
// ))"));
//
//     // restruct test
//     /*
//     Assert.AreEqual("((8 9 8 9 8 9 8) ((4 4) 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1))", Evaluate(@"
// (r-e-p-loop '(
// (restruct (quote (7)) (quote (8 9)))
// (restruct (quote (4 4)) (quote (1 0 0 0 0)))
// ))"));
//      */
//     Assert.AreEqual("((8 9 8 9 8 9 8) ((4 4) 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1))", Evaluate(@"
// (r-e-p-loop (list
// (list 'restruct (list 'quote '(7)) (list 'quote '(8 9)))
// (list 'restruct (list 'quote '(4 4)) (list 'quote '(1 0 0 0 0)))
// ))"));
//
//     // trans test
//     /*
//     Assert.AreEqual("(((4 3) 1 5 9 2 6 10 3 7 11 4 8 12))", Evaluate(@"
// (select '(1) (r-e-p-loop '(
// (set m1 (restruct (quote (3 4)) (indx 12)))
// (trans m1)
// )))"));
//      */
//     Assert.AreEqual("(((4 3) 1 5 9 2 6 10 3 7 11 4 8 12))", Evaluate(@"
// (select '(1) (r-e-p-loop (list
// (list 'set 'm1 (list 'restruct (list 'quote '(3 4)) '(indx 12)))
// '(trans m1)
// )))"));
//
//     // [] test
//     /*
//     Assert.AreEqual("((5) (7 8 9 0) ((1 4) 5 6 7 8) ((2 4) 9 10 11 12 1 2 3 4))", Evaluate(@"
// (select '(2 3 4 5) (r-e-p-loop '(
// (set v1 (quote (8 6 7 5 3 0 9)))
// (set m1 (restruct (quote (3 4)) (indx 12)))
// ([] v1 4)
// ([] v1 (quote (3 1 7 6)))
// ([] m1 2)
// ([] m1 (quote (3 1)))
// )))"));
//      */
//     Assert.AreEqual("((5) (7 8 9 0) ((1 4) 5 6 7 8) ((2 4) 9 10 11 12 1 2 3 4))", Evaluate(@"
// (select '(2 3 4 5) (r-e-p-loop (list
// (list 'set 'v1 (list 'quote '(8 6 7 5 3 0 9)))
// (list 'set 'm1 (list 'restruct (list 'quote '(3 4)) '(indx 12)))
// '([] v1 4)
// (list '[] 'v1 (list 'quote '(3 1 7 6)))
// '([] m1 2)
// (list '[] 'm1 (list 'quote '(3 1)))
// )))"));
//
//     // compress test
//     /*
//     Assert.AreEqual("((8 7 5 0) ((2 4) 5 6 7 8 13 14 15 16))", Evaluate(@"
// (select '(2 3) (r-e-p-loop '(
// (set v1 (quote (8 6 7 5 3 0 9)))
// (set m1 (restruct (quote (4 4)) (indx 16)))
// (compress (quote (1 0 1 1 0 1 0)) v1)
// (compress (quote (0 1 0 1)) m1)
// )))"));
//      */
//     Assert.AreEqual("((8 7 5 0) ((2 4) 5 6 7 8 13 14 15 16))", Evaluate(@"
// (select '(2 3) (r-e-p-loop (list
// (list 'set 'v1 (list 'quote '(8 6 7 5 3 0 9)))
// (list 'set 'm1 (list 'restruct (list 'quote '(4 4)) '(indx 16)))
// (list 'compress (list 'quote '(1 0 1 1 0 1 0)) 'v1)
// (list 'compress (list 'quote '(0 1 0 1)) 'm1)
// )))"));
//
//     // primes<= test (see pages 74-75)
//     Assert.AreEqual("(((4 7) 0 1 1 1 1 1 1 0 0 2 2 2 2 2 0 1 0 3 3 3 3 0 0 1 0 4 4 4) (2 3 5 7))", Evaluate(@"
// (select '(2 4) (r-e-p-loop '(
// (define mod (m n) (- m (* n (/ m n))))
// (define mod-outer-probe (v1 v2)
// (mod (trans (restruct (cat (shape v2) (shape v1)) v1))
//     (restruct (cat (shape v1) (shape v2)) v2)))
// (mod-outer-probe (indx 4) (indx 7))
// ; Perhaps we could implement 'let', and then use (let ((s (indx n))) ...)
// (define primes<= (n) (compress (= 2 (+/ (= 0 (mod-outer-probe (set s (indx n)) s)))) s))
// (primes<= 7)
// )))"));
//
//     // +\ ("+-scan") test (see page 74).  This tests the "if" construct.
//     /*
//     Assert.AreEqual("(0)", Evaluate(@"
// (select '(0) (r-e-p-loop '(
// (= (shape (quote (1 3 5 7))) 0)
// )))"));
//      */
//     Assert.AreEqual("(0)", Evaluate(@"
// (select '(0) (r-e-p-loop (list
// (list '= (list 'shape (list 'quote '(1 3 5 7))) 0)
// )))"));
//     /*
//     Assert.AreEqual("(0)", Evaluate(@"
// (select '(1) (r-e-p-loop '(
// (define foo (v) (if (= (shape v) 0) 1 0))
// (foo (quote (1 3 5 7)))
// )))"));
//      */
//     Assert.AreEqual("(0)", Evaluate(@"
// (select '(1) (r-e-p-loop (list
// '(define foo (v) (if (= (shape v) 0) 1 0))
// (list 'foo (list 'quote '(1 3 5 7)))
// )))"));
//
//     /*
//     Assert.AreEqual("((1 4 9 16))", Evaluate(@"
// (select '(2) (r-e-p-loop '(
// (define dropend (v) ([] v (indx (- (shape v) 1))))
// (define +\ (v)
// (if (= (shape v) 0) v
//     (cat (+\ (dropend v)) (+/ v))))
// (+\ (quote (1 3 5 7)))
// )))"));
//      */
//     Assert.AreEqual("((1 4 9 16))", Evaluate(@"
// (select '(2) (r-e-p-loop (list
// '(define dropend (v) ([] v (indx (- (shape v) 1))))
// '(define +\ (v)
// (if (= (shape v) 0) v
//     (cat (+\ (dropend v)) (+/ v))))
// (list '+\ (list 'quote '(1 3 5 7)))
// )))"));
// }
//
// [Test]
// public void MacroApostrophesToQuoteKeywordsTest()
// {
//     // Note that these expressions are parsed, but not evaluated.
//     Assert.AreEqual("(lambda (foo) (quote bar))", MacroDefinition.ObjectToString_ApostrophesToQuoteKeywords(GetParseResult("(lambda (foo) 'bar)")));
//     Assert.AreEqual("(foo (quote bar) (quote baz))", MacroDefinition.ObjectToString_ApostrophesToQuoteKeywords(GetParseResult("(foo 'bar 'baz)")));
//     Assert.AreEqual("((lambda (foo) (quote bar)) (quote baz))", MacroDefinition.ObjectToString_ApostrophesToQuoteKeywords(GetParseResult("((lambda (foo) 'bar) 'baz)")));
//     Assert.AreEqual("(letrec ((foo (quote bar))) (quote baz))", MacroDefinition.ObjectToString_ApostrophesToQuoteKeywords(GetParseResult("(letrec ((foo 'bar)) 'baz)")));
//     Assert.AreEqual("(call/cc (lambda (foo) (foo (quote bar))))", MacroDefinition.ObjectToString_ApostrophesToQuoteKeywords(GetParseResult("(call/cc (lambda (foo) (foo 'bar)))")));
// }
//
// [Test]
// public void ComposeListTest() // 2013/11/30
// {
//     Evaluate("(set compose-list (combine id compose id))");
//     Evaluate("(set cadaddr (compose-list (list cdr cdr car cdr car)))");
//
//     Assert.AreEqual("10", Evaluate("(cadaddr '((1 2 3 4) (5 6 7 8) (9 10 11 12) (13 14 15 16)))"));
//
//     // 2013/12/02
//     Evaluate("(set compose-list-reverse (combine id (reverse2args compose) id))");
//     Evaluate("(set cadaddr (compose-list-reverse (list car cdr car cdr cdr)))");    // The functions are applied from right to left.
//
//     Assert.AreEqual("10", Evaluate("(cadaddr '((1 2 3 4) (5 6 7 8) (9 10 11 12) (13 14 15 16)))"));
//
//     Evaluate("(set sumplus3 (compose2args + (compose-list (list +1 +1 +1))))");
//
//     Assert.AreEqual("18", Evaluate("(sumplus3 7 8)"));
// }
//
// [Test]
// public void GeneralFindTest() // 2013/12/03
// {
//     Evaluate(@"
// (set general-find (lambda (pred result zero)
// (letrec
// ((loop
//     (lambda (l)
//         (cond
//             ((null? l) zero)
//             ((pred (car l)) (result (car l)))
//             ('T (loop (cdr l)))
//         )
//     )
// ))
// loop
// )
// ))");
//     Evaluate(@"
// (set original-find (lambda (pred lis)
// (
// (general-find
//     pred
//     (lambda (x) 'T)
//     '()
// )
// lis
// )
// ))");
//     Evaluate("(set original-contains (lambda (x l) (original-find ((curry =) x) l)))");
//
//     Assert.AreEqual("T", Evaluate("(original-contains 5 '(2 3 5 7))"));
//     Assert.AreEqual("()", Evaluate("(original-contains 4 '(2 3 5 7))"));
//
//     Evaluate(@"
// (set alist-alt (lambda (x alist)
// (
// (general-find
//     (compose car ((curry =) x))
//     cadr
//     '()
// )
// alist
// )
// ))");
//     Evaluate("(set sample-alist '((2 11) (3 13) (5 19) (7 19)))");
//
//     Assert.AreEqual("13", Evaluate("(alist-alt 3 sample-alist)"));
//     Assert.AreEqual("()", Evaluate("(alist-alt 4 sample-alist)"));
// }
//
// [Test]
// public void SyntaxExceptionTest() // 2013/12/12
// {
//     InferenceAssert.ThrowsWithLineAndColumnNumbers<SyntaxException>(() => Evaluate("(if 'T 7 13 'SyntaxError)"), 1, 13);
// }
//
// [Test]
// public void EvaluationExceptionTest() // 2013/12/12
// {
//     InferenceAssert.ThrowsWithLineAndColumnNumbers<EvaluationException>(() => Evaluate("(car 7)"), 1, 2);
// }
//
// [Test]
// public void StringLessThanTest()    // 2013/12/14
// {
//     Assert.AreEqual("T", Evaluate("(primop? string<)"));
//
//     Assert.AreEqual("()", Evaluate("(string< \"a\" \"a\")"));
//     Assert.AreEqual("T", Evaluate("(string< \"a\" \"b\")"));
//     Assert.AreEqual("()", Evaluate("(string< \"b\" \"a\")"));
//     Assert.AreEqual("T", Evaluate("(string< \"abac\" \"abacus\")"));
//     Assert.AreEqual("T", Evaluate("(string< \"abacab\" \"abacus\")"));
// }
//
// [Test]
// public void StringSortTest()    // 2013/12/14
// {
//     globalInfo.LoadPreset("sort");
//
//     // 1) Insertion sort.
//     Assert.AreEqual("(a ab abacab abacus abbot abbreviate abcess baa)",
//         Evaluate("((insertion-sort string<) '(\"abbreviate\" \"abacab\" \"abbot\" \"a\" \"baa\" \"abcess\" \"ab\" \"abacus\"))"));
//
//     // 2) Quicksort.
//     Assert.AreEqual("(a ab abacab abacus abbot abbreviate abcess baa)",
//         Evaluate("((quicksort string<) '(\"abbreviate\" \"abacab\" \"abbot\" \"a\" \"baa\" \"abcess\" \"ab\" \"abacus\"))"));
//
//     // 3) Merge sort.
//     Assert.AreEqual("(a ab abacab abacus abbot abbreviate abcess baa)",
//         Evaluate("((merge-sort string<) '(\"abbreviate\" \"abacab\" \"abbot\" \"a\" \"baa\" \"abcess\" \"ab\" \"abacus\"))"));
// }
//
// [Test]
// public void RepeatListTest()    // 2014/02/15.  This might be useful in "restruct" in our Scheme APL interpreter.
// {
//     Evaluate(@"
// (set repeat-list (lambda (n master)
// (letrec
// ((loop (lambda (n lm)
//     (if (<= n lm)
//         (take n master) ; Verify the order of take's args
//         (append master (loop (- n lm) lm))
//     )
// )))
// (loop n (length master))
// )
// ))");
//
//     Assert.AreEqual("(2 3 5 7 2 3 5 7 2 3 5)", Evaluate("(repeat-list 11 '(2 3 5 7))"));
// }
