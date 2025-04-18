// util.go

package main

import "fmt"

// Factorial returns n! recursively.
func Factorial(n int) int {
	if n <= 1 {
		return 1
	}
	return n * Factorial(n-1)
}

func main() {
	fmt.Println(Factorial(5))
}