# analytics.py

"""
A small analytics module demonstrating multiple functions and classes.
"""

class DataPoint:
    """Represents a data point in the analytics system."""
    def __init__(self, timestamp: str, value: float):
        self.timestamp = timestamp
        self.value = value

class Analyzer:
    """Performs statistical analysis on a list of DataPoint objects."""
    def __init__(self, data: list[DataPoint]):
        self.data = data

    def mean(self) -> float:
        """Compute the mean of the data values."""
        return sum(dp.value for dp in self.data) / len(self.data)

    def max(self) -> DataPoint:
        """Find the data point with the maximum value."""
        return max(self.data, key=lambda dp: dp.value)

    def report(self) -> None:
        """Prints a summary report to stdout."""
        print(f"Data points: {len(self.data)}")
        print(f"Mean value: {self.mean()}")
        print(f"Max value: {self.max().value} at {self.max().timestamp}")