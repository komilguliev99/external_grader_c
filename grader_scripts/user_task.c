#include "stdio.h"

int		main(void)
{
	int		a[200000];
	int		n, x, i, cnt = 0;;
	float		amg = 0;

	scanf("%d", &n);
	i = 0;
	while (i < n)
	{
		scanf("%d", &x);
		a[i] = x;
		if (x % 2 == 1 || x == 0)
		{
			amg += x;
			cnt++;
		}
		i++;
	}
	amg /= cnt;
	i = 0;
	while (i < n)
	{
		if (a[i] <= amg)
			printf("%d ", a[i]);
		i++;
	}
	return (0);
}
