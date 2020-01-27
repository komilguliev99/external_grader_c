#include <stdio.h>
#include <stdlib.h>

int		main()
{
	int		n;
	int		m;
	int		*arr;
	int		min;
	int		max;
	int		len;
	int		i;
	int		*newarr;

	scanf("%d", &n);
	arr = (int*)malloc(sizeof(int) * n);
	for (int i = 0; i < n; i++)
		scanf("%d", arr + i);
	min = 0;
	for (int i = 1; i < n; i++)
		if (arr[min] > arr[i])
			min = i;
	max = -1;
	for (int i = n - 1; i >= 0 && max == -1; i--)
		if (arr[i] % 5  == 0)
			max = i;
	len = max - min - 1;
	if (len > 0)
	{
		i = 0;
		m = n - len;
		newarr = (int*)malloc(sizeof(int) * m);
		for (i = 0; i <= min; i++)
			newarr[i] = arr[i];
		for (int j = max; j < n; j++)
			newarr[i++] = arr[j];
	}
	else
	{
		m = min + 1;
		newarr = (int*)malloc(sizeof(int) * m);
		for (int i = 0; i <= min; i++)
			newarr[i] = arr[i];
	}
	free(arr);
	for (int i = 0; i < m; i++)
		printf("%d ", newarr[i]);
		
	// printf("max = %d\n", max);
	// printf("min = %d\n", min);
	// for (int i = 0; i < n; i++)
	// 	printf("%d ", arr[i]);
	// printf("%d\n", n);
}