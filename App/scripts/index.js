/* global $:false, console:false, moment:false, Chart:false ~~:false */

function showProduct(productId)
{
    'use strict';

    $.getJSON('http://api.apbsales.sexyfishhorse.com/products/' + productId).done(function (data)
    {
        var product = data.Product;
        var history = data.History;
        var pricing = data.Pricing;
        var normal = pricing.Normal;
        var latest = pricing.Latest;
        var onSale = latest.Price < normal.Price || latest.Premium < normal.Premium;

        history = history.reverse();
        var timestamps = [];

        var prices = [];
        var premiumPrices = [];

        var productModal = $('#product-modal');

        for (var i = 0; i < history.length; i++)
        {
            var item = history[i];
            timestamps.push(moment(item.Timestamp).calendar());
            prices.push(item.Price);
            premiumPrices.push(item.Premium);

            if (i === 0)
            {
                productModal.find('.period-from').text(moment(item.Timestamp).calendar());
            }

            if (i + 1 === history.length)
            {
                productModal.find('.period-to').text(moment(item.Timestamp).calendar());
            }
        }

        var pricingContent = generatePricing(normal, latest);

        productModal.find('h2').text(product.Title);
        productModal.find('.product-image').attr('src', product.ImageUrl);
        productModal.find('.last-updated').text(moment(latest.Timestamp).fromNow());
        productModal.find('.pricing-container').empty().html(pricingContent);
        productModal.find('a').attr('href', product.Url);
        productModal.find('.alert-signup .product-id').val(productId);
        productModal.find('.category span').text(product.Category);

        productModal.find('.signup .signed-up-alert-box').hide();

        if (onSale)
        {
            productModal.find('.on-sale').show();
            productModal.find('.signup .unavailable').show();
        }
        else
        {
            productModal.find('.signup .available').show();
            productModal.find('.signup .unavailable').hide();
        }

        var ctx = $('#price-chart').get(0).getContext("2d");
        ctx.clearRect(0, 0, 600, 200);

        var chartData = {
            labels: timestamps, datasets: [{
                label: 'Non premium price',
                fillColor: "rgba(67, 172, 106, 0.2)",
                strokeColor: "rgba(67, 172, 106, 1)",
                pointColor: "rgba(67, 172, 106, 1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(67, 172, 106, 1)",
                data: prices
            },
                {
                    label: 'Premium price',
                    fillColor: "rgba(240, 138, 36, 0.2)",
                    strokeColor: "rgba(240, 138, 36, 1)",
                    pointColor: "rgba(240, 138, 36, 1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(240, 138, 36, 1)",
                    data: premiumPrices
                }]
        };

        var chart = new Chart(ctx).Line(chartData,
            {
                scaleBeginAtZero: true,
                bezierCurve: true,
                bezierCurveTension: 0.3,
                legendTemplate: '<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li style=\"color:<%=datasets[i].strokeColor%>\"><i class="fa fa-square"></i> <%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
            });

        var legend = chart.generateLegend();

        productModal.foundation('reveal', 'open');

        $('.chart-legend-container').html(legend);
    });
}

function generatePricing(defaultPrice, currentPrice, premiumPrice)
{
    'use strict';

    var result = '<div class="prices">';

    // Price

    result += '<div class="price">';

    if (currentPrice < defaultPrice)
    {
        var percentage = Math.round((1 - (currentPrice / defaultPrice)) * 100);
        result += '<span class="normal discounted">' + defaultPrice + ' G1C</span> ';
        result += '<span class="latest">' + currentPrice + ' G1C</span> ';
        result += '<span class="discount">Save <span class="percentage">' + percentage + '</span> %</span>';
    }
    else
    {
        result += '<span class="normal">' + defaultPrice + ' G1C</span> ';
    }

    result += '</div>';

    // Premium
    if (premiumPrice > 0)
    {
        result += '<div class="price premium">';
        result += '<i class="fa fa-star premium-star has-tip" data-tooltip aria-haspopup="true" title="Premium"></i> ';

        var premiumDiscount = Math.round((1 - (premiumPrice / defaultPrice)) * 100);

        if (premiumDiscount > 0 && premiumDiscount !== 20)
        {
            result += '<span class="latest">' + premiumPrice + ' G1C</span> ';
            result += '<span class="discount">Save <span class="percentage">' + premiumDiscount + '</span> %</span>';
        }
        else
        {
            result += '<span class="normal">' + premiumPrice + ' G1C</span> ';
        }

        result += '</div>';
    }

    result += '</div>';

    return result;
}
function showProducts(data)
{
    'use strict';
    if (data && data.length > 0)
    {
        $('.nothing-found').slideUp('fast', function ()
        {
            $('.found-products').slideDown('slow');
        });

        var results = $('.product-results');

        for (var i = 0; i < data.length; i++)
        {
            var product = data[i];
            var defaultPrice = product.Prices[0]['Value'];
            var currentPrice = product.Prices[1]['Value'];
            var premiumPrice = product.Prices[2]['Value'];
            var timestamp = product.Prices[1].Timestamp;
            var onSale = false;

            if (currentPrice < defaultPrice)
            {
                onSale = true;
            }
            else
            {
                var premiumDiscount = Math.round((1 - (premiumPrice / defaultPrice)) * 100);

                onSale = premiumDiscount !== 0 && premiumDiscount !== 20;
            }

            var result = '<li><div class="product" id="' + product.Id + '">';
            result += '<img onload="fadeIn(this)" class="product-image" src="' + product.ImageUrl + '" alt="' +
            product.Title + '"/>';
            result += '<div class="timestamp"><i class="fa fa-clock-o"></i> ' + moment(timestamp).fromNow() + '</div>';
            result += '<div class="title">';
            result += '<h3>' + product.Title + '</h3>';
            if (onSale)
            {
                result += '<div class="on-sale">On sale!</div>';
            }
            result += '<div class="category"><i class="fa fa-tag"></i> ' + product.Category + '</div>';
            result += '</div>';
            result += generatePricing(defaultPrice, currentPrice, premiumPrice);
            result += '</div></li>';

            $(result).hide().prependTo(results).slideDown('fast').delay(200);
        }

        $(document).foundation('tooltip', 'reflow');
    }
    else
    {
        $('.found-products').slideUp('fast', function ()
        {
            $('.nothing-found').slideDown('slow');
        });
    }
}

function showNothingFound(data)
{
    'use strict';
    console.error(data);
    $('.found-products').slideUp('fast', function ()
    {
        $('.nothing-found').slideDown('slow');
    });
}

function performSearch(e)
{
    'use strict';
    e.preventDefault();

    if (e.type !== "valid")
    {
        return;
    }

    var results = $('.product-results');
    var text = $('#search-value').val();
    results.find('.product').fadeOut();
    results.empty();

    var hint = "Text";

    if (text > 1000)
    {
        hint = "Id";
    }
    else if (text.match('^http://'))
    {
        hint = "Url";
    }
    else
    {
        hint = "Text";
    }

    if (!hint || !text)
    {
        return;
    }

    $('.search-term').text(text);
    $('.search-bar').addClass('large-12').addClass('to-top');
    $('.search-bar .field').removeClass('small-11').addClass('small-11');
    $('.search-bar .search-button').removeClass('small-2').addClass('small-1');

    $('.results').slideDown('fast');

    $.post('http://api.apbsales.sexyfishhorse.com/products/search',
        JSON.stringify({'Term': text, 'Hint': hint})).done(showProducts).error(showNothingFound);

    results.on('click', '.product', function ()
    {
        showProduct(this.id);
    });
}

function performAlertSignup(e)
{
    'use strict';
    e.preventDefault();

    if (e.type !== "valid")
    {
        return;
    }

    var email = $('.alert-signup #email-address').val();
    var productId = $('.alert-signup .product-id').val();

    $.post('http://api.apbsales.sexyfishhorse.com/alerts/signup',
        JSON.stringify({'Email': email, ProductId: productId})).done(function ()
        {
            $('.signup .signed-up-alert-box').text('You have been successfully signed up. You will receive an email the next time this product goes on sale.').hide().fadeIn();
        });

}